import { NextRequest, NextResponse } from "next/server";
import { appendEscalation } from "@/lib/googleSheets";
import type { EscalationInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<EscalationInput>;

    const city = (body.city ?? "").trim();
    const store = (body.store ?? "").trim();
    const riderId = (body.riderId ?? "").trim();
    const mediaUrl = (body.mediaUrl ?? "").trim();
    const mediaType = body.mediaType ?? "";

    const missing: string[] = [];
    if (!city) missing.push("City");
    if (!store) missing.push("Store");
    if (!riderId) missing.push("Rider ID");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Please fill in: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const record = await appendEscalation({
      city,
      store,
      riderId,
      mediaType,
      mediaUrl,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/escalations] failed:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong while saving the escalation. Please try again.",
      },
      { status: 500 }
    );
  }
}
