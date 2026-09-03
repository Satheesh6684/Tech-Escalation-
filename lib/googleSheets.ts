import { google, sheets_v4 } from "googleapis";
import type { Escalation, EscalationInput, MasterData } from "./types";
import { generateRecordId } from "./utils";

/**
 * This module is the ONLY place that talks to Google Sheets. It is
 * server-only (never imported by client components) so the service
 * account credentials never reach the browser.
 *
 * Design goals (per project spec):
 *  - Never delete or overwrite existing data in the spreadsheet.
 *  - Never touch any tab other than the configured one.
 *  - Create the configured tab + header row automatically if missing.
 *  - Read/write by matching column NAMES to the header row (not fixed
 *    column indexes), so an existing/adapted header layout is respected
 *    instead of assumed.
 */

const EXPECTED_HEADERS = [
  "Record ID",
  "Created At",
  "City",
  "Store",
  "Rider ID",
  "Issue",
  "Media Type",
  "Media URL",
] as const;

type HeaderName = (typeof EXPECTED_HEADERS)[number];

/**
 * Thrown for expected, actionable configuration problems (a missing tab,
 * missing headers) where the message itself is safe and useful to show
 * directly in the UI — it never contains credentials or raw API errors.
 */
export class SheetConfigError extends Error {}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSheetTabName(): string {
  return process.env.GOOGLE_SHEET_TAB?.trim() || "Escalations";
}

function getMasterTabName(): string {
  return process.env.GOOGLE_MASTER_SHEET_TAB?.trim() || "Master";
}

/** Case/whitespace-insensitive match, e.g. "master" or " Master " both hit "Master". */
function normalize(s: string | null | undefined): string {
  return (s ?? "").toString().trim().toLowerCase();
}

/**
 * Finds the real tab title matching `wanted`, tolerating differences in
 * case or surrounding whitespace (a very common source of "tab not
 * found" errors when a tab was renamed by hand). Returns the exact title
 * as Google Sheets has it, since A1-notation ranges are case-sensitive.
 */
function findTabTitle(
  existingTabs: (string | null | undefined)[],
  wanted: string
): string | undefined {
  return existingTabs.find((t) => normalize(t) === normalize(wanted)) ?? undefined;
}

let cachedClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  // Private keys are typically stored with literal \n escape sequences in
  // env vars. Convert them back into real newlines.
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

/**
 * Ensures the configured tab exists and has a header row, WITHOUT ever
 * deleting or modifying any other tab or any existing data rows.
 * Returns the actual header row in use (existing or newly created), so
 * callers can map fields by name rather than assuming column order.
 */
async function ensureSheetReady(): Promise<{ headers: string[]; tabTitle: string }> {
  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEET_ID");
  const tabName = getSheetTabName();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTabs = (meta.data.sheets ?? []).map(
    (s) => s.properties?.title
  );
  const matchedTab = findTabTitle(existingTabs, tabName);

  if (!matchedTab) {
    // Tab does not exist yet — create it. This never touches any other tab.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...EXPECTED_HEADERS]] },
    });
    return { headers: [...EXPECTED_HEADERS], tabTitle: tabName };
  }

  // Tab exists — read its current header row instead of assuming one.
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${matchedTab}'!1:1`,
  });
  const headerRow = headerRes.data.values?.[0] ?? [];

  if (headerRow.length === 0) {
    // Tab exists but is completely empty (no data was ever added) — safe
    // to write the header row without overwriting anything.
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${matchedTab}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...EXPECTED_HEADERS]] },
    });
    return { headers: [...EXPECTED_HEADERS], tabTitle: matchedTab };
  }

  return { headers: headerRow as string[], tabTitle: matchedTab };
}

function rowToEscalation(headers: string[], row: string[]): Escalation | null {
  const get = (name: HeaderName) => {
    const idx = headers.findIndex((h) => normalize(h) === normalize(name));
    return idx === -1 ? "" : row[idx] ?? "";
  };

  const recordId = get("Record ID");
  if (!recordId) return null; // skip blank/unrelated rows

  return {
    recordId,
    createdAt: get("Created At"),
    city: get("City"),
    store: get("Store"),
    riderId: get("Rider ID"),
    issue: "Incomplete Order",
    mediaType: (get("Media Type") as Escalation["mediaType"]) || "",
    mediaUrl: get("Media URL"),
  };
}

function escalationToRow(
  headers: string[],
  data: Omit<Escalation, "issue"> & { issue: string }
): string[] {
  const valueFor = (header: string): string => {
    const match = EXPECTED_HEADERS.find(
      (h) => normalize(h) === normalize(header)
    );
    switch (match) {
      case "Record ID":
        return data.recordId;
      case "Created At":
        return data.createdAt;
      case "City":
        return data.city;
      case "Store":
        return data.store;
      case "Rider ID":
        return data.riderId;
      case "Issue":
        return data.issue;
      case "Media Type":
        return data.mediaType;
      case "Media URL":
        return data.mediaUrl;
      default:
        return ""; // unknown/custom column already in the sheet — leave blank
    }
  };
  return headers.map(valueFor);
}

export async function listEscalations(): Promise<Escalation[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEET_ID");

  const { headers, tabTitle } = await ensureSheetReady();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabTitle}'!A2:Z`, // start after header row
  });

  const rows = res.data.values ?? [];
  const records: Escalation[] = [];
  for (const row of rows) {
    const record = rowToEscalation(headers, row as string[]);
    if (record) records.push(record);
  }

  // Newest first for the dashboard.
  records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return records;
}

export async function appendEscalation(
  input: EscalationInput
): Promise<Escalation> {
  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEET_ID");

  const { headers, tabTitle } = await ensureSheetReady();

  const record: Escalation = {
    recordId: generateRecordId(),
    createdAt: new Date().toISOString(),
    city: input.city.trim(),
    store: input.store.trim(),
    riderId: input.riderId.trim(),
    issue: "Incomplete Order",
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl,
  };

  const row = escalationToRow(headers, record);

  // Appends after the last row with data — never overwrites existing rows.
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tabTitle}'!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return record;
}

/**
 * Reads the standard/master City + Store list from a dedicated tab
 * (default name "Master", configurable via GOOGLE_MASTER_SHEET_TAB).
 * This tab is treated as read-only reference data owned by ops — the app
 * never writes to it. It must already exist in the spreadsheet with
 * "City" and "Store" column headers (one row per store).
 *
 * Cities with no stores listed under them are still returned in `cities`
 * (with an empty store list) so an operations team can add a city ahead
 * of its stores being finalized.
 */
export async function getMasterData(): Promise<MasterData> {
  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEET_ID");
  const tabName = getMasterTabName();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTabs = (meta.data.sheets ?? []).map(
    (s) => s.properties?.title
  );
  const matchedTab = findTabTitle(existingTabs, tabName);

  if (!matchedTab) {
    const foundList = existingTabs.filter(Boolean).join(", ") || "(none)";
    throw new SheetConfigError(
      `Master data tab "${tabName}" was not found in the spreadsheet. ` +
        `Create a tab named exactly "${tabName}" with "City" and "Store" ` +
        `column headers listing your standard cities and stores. ` +
        `Tabs currently in this spreadsheet: ${foundList}.`
    );
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${matchedTab}'!A1:Z`,
  });
  const rows = res.data.values ?? [];

  if (rows.length === 0) {
    return { cities: [], storesByCity: {} };
  }

  const headers = rows[0] as string[];
  const cityIdx = headers.findIndex((h) => normalize(h) === "city");
  const storeIdx = headers.findIndex((h) => normalize(h) === "store");

  if (cityIdx === -1 || storeIdx === -1) {
    const foundHeaders = headers.filter(Boolean).join(", ") || "(empty row)";
    throw new SheetConfigError(
      `The "${matchedTab}" tab must have "City" and "Store" column headers ` +
        `in its first row. Headers currently found: ${foundHeaders}.`
    );
  }

  const citySet = new Set<string>();
  const storesByCity: Record<string, string[]> = {};

  for (const row of rows.slice(1)) {
    const city = (row[cityIdx] ?? "").toString().trim();
    const store = (row[storeIdx] ?? "").toString().trim();
    if (!city) continue;

    citySet.add(city);
    if (store) {
      if (!storesByCity[city]) storesByCity[city] = [];
      if (!storesByCity[city].includes(store)) {
        storesByCity[city].push(store);
      }
    }
  }

  const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b));
  for (const city of Object.keys(storesByCity)) {
    storesByCity[city].sort((a, b) => a.localeCompare(b));
  }

  return { cities, storesByCity };
}
