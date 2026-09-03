import { NextRequest, NextResponse } from "next/server";
import { uploadMedia } from "@/lib/storage";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was received. Please choose a photo or video." },
        { status: 400 }
      );
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "That file type isn't supported. Please upload a JPG, PNG, WEBP, MP4, or MOV file.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 50 MB." },
        { status: 400 }
      );
    }

    const { url, mediaType } = await uploadMedia(file);

    return NextResponse.json({ url, mediaType }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload] failed:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong while uploading the file. Please try again.",
      },
      { status: 500 }
    );
  }
}
