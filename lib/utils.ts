export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Generates a human-readable, sufficiently unique escalation record ID. */
export function generateRecordId(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ESC-${datePart}-${randomPart}`;
}

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

export function isVideoMime(mime: string) {
  return mime.startsWith("video/");
}
