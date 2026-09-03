import { NextResponse } from "next/server";
import { getMasterData, SheetConfigError } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMasterData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/master] failed:", err);

    if (err instanceof SheetConfigError) {
      // Safe to show as-is — names only the tab/header setup, never
      // credentials or raw API internals.
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading City/Store options. Please try again. If this keeps happening, check /api/setup for details.",
      },
      { status: 500 }
    );
  }
}
