/**
 * One-time / repeatable helper to verify Google Sheets access and create
 * the "Escalations" tab + header row if it doesn't exist yet.
 *
 * Usage:
 *   1. Copy .env.example to .env.local and fill in real values, OR run
 *      `vercel env pull .env.local` if the project is already linked.
 *   2. npm run setup-sheet
 *
 * This script NEVER deletes or overwrites existing rows — see
 * lib/googleSheets.ts for the exact safety guarantees.
 */
import { config } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.local")) config({ path: ".env.local" });
else config();

async function main() {
  const { listEscalations, getMasterData } = await import(
    "../lib/googleSheets"
  );

  console.log("Connecting to Google Sheets...\n");

  console.log(`Escalations tab ("${process.env.GOOGLE_SHEET_TAB || "Escalations"}")`);
  const records = await listEscalations();
  console.log(`  ✅ Connected. Existing records found: ${records.length}`);
  if (records.length > 0) {
    console.log(`  Most recent record ID: ${records[0].recordId}`);
  }
  console.log(
    "  (If this tab did not exist yet, it has now been created with the correct headers.)"
  );

  console.log(
    `\nMaster data tab ("${process.env.GOOGLE_MASTER_SHEET_TAB || "Master"}")`
  );
  const master = await getMasterData();
  const storeCount = Object.values(master.storesByCity).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  console.log(
    `  ✅ Connected. Cities: ${master.cities.length}, Stores: ${storeCount}`
  );
  if (master.cities.length === 0) {
    console.log(
      "  ⚠️  No cities found — add rows with City/Store columns to this tab."
    );
  }
}

main().catch((err) => {
  console.error("❌ Setup check failed:\n");
  console.error(err instanceof Error ? err.message : err);
  console.error(
    "\nCommon causes:\n" +
      "  - GOOGLE_SHEET_ID is wrong (copy it from the sheet's URL)\n" +
      "  - The sheet has not been shared with the service account email\n" +
      "    (share it as 'Editor')\n" +
      "  - GOOGLE_PRIVATE_KEY was pasted without preserving line breaks\n" +
      "  - The Master tab doesn't exist yet, or is missing 'City'/'Store'\n" +
      "    column headers\n"
  );
  process.exit(1);
});
