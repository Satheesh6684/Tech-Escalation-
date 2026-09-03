import { put } from "@vercel/blob";

/**
 * Uploads a media file to Vercel Blob storage and returns its public URL.
 * Server-only — the BLOB_READ_WRITE_TOKEN never reaches the browser.
 *
 * Vercel Blob was chosen because it requires no separate account, is
 * natively integrated with Vercel deployments, and works well for the
 * image/video evidence files this app handles. See README.md if you'd
 * rather swap in Cloudinary or S3 — lib/storage.ts is the only file that
 * needs to change.
 */
export async function uploadMedia(
  file: File
): Promise<{ url: string; mediaType: "image" | "video" }> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Unsupported file type");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const pathname = `escalations/${Date.now()}-${safeName}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url, mediaType: isImage ? "image" : "video" };
}
