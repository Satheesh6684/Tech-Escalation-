import { NextResponse } from "next/server";
import { getMasterData, listEscalations } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

/**
 * Visit /api/setup once after deployment (or whenever you want to confirm
 * the app can reach your Google Sheet). It checks both the Escalations
 * tab (creating it + its header row if missing) and the Master data tab
 * (read-only — must already exist). No secrets are returned.
 */
export async function GET() {
  const result: Record<string, unknown> = { status: "ok" };

  try {
    const records = await listEscalations();
    result.escalationsTab = {
      status: "ok",
      tab: process.env.GOOGLE_SHEET_TAB || "Escalations",
      existingRecordCount: records.length,
    };
  } catch (err) {
    result.status = "error";
    result.escalationsTab = {
      status: "error",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }

  try {
    const master = await getMasterData();
    result.masterTab = {
      status: "ok",
      tab: process.env.GOOGLE_MASTER_SHEET_TAB || "Master",
      cityCount: master.cities.length,
      storeCount: Object.values(master.storesByCity).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    };
  } catch (err) {
    result.status = "error";
    result.masterTab = {
      status: "error",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }

  return NextResponse.json(result, {
    status: result.status === "ok" ? 200 : 500,
  });
}
