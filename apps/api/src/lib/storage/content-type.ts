import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".vtt": "text/vtt",
  ".srt": "application/x-subrip",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

export function guessContentType(relativePath: string): string {
  return CONTENT_TYPES[path.extname(relativePath).toLowerCase()] ?? "application/octet-stream";
}
