import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../../env.js";

/**
 * Local scratch space used by ffmpeg (which needs real filesystem paths) and by
 * incoming uploads before they're handed off to the configured StorageService.
 * When STORAGE_DRIVER=local this directory doubles as the final public storage
 * (served via the /media static route); when STORAGE_DRIVER=s3 it's just a
 * temp area that gets cleaned up after each upload.
 */
const scratchRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);

export function resolveScratchPath(relativePath: string): string {
  return path.join(scratchRoot, relativePath);
}

export async function ensureScratchDir(relativePath: string): Promise<void> {
  await fs.mkdir(resolveScratchPath(relativePath), { recursive: true });
}

export async function removeScratchPath(relativePath: string): Promise<void> {
  await fs.rm(resolveScratchPath(relativePath), { recursive: true, force: true });
}
