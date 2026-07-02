import path from "node:path";
import { env } from "../../../env.js";
import { storage, isS3Storage, resolveScratchPath, ensureScratchDir, removeScratchPath } from "../../../lib/storage/index.js";
import { runCommand, probeDurationSeconds } from "./ffmpeg.util.js";

export interface TranscodeResult {
  hlsPlaylistUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

export async function transcodeVideoToHls(
  videoId: string,
  sourceFilePath: string,
  options: { generateThumbnail: boolean }
): Promise<TranscodeResult> {
  const hlsRelativeDir = path.join("hls", videoId);
  await ensureScratchDir(hlsRelativeDir);
  const hlsScratchDir = resolveScratchPath(hlsRelativeDir);
  const playlistPath = path.join(hlsScratchDir, "index.m3u8");
  const segmentPattern = path.join(hlsScratchDir, "segment_%03d.ts");

  await runCommand(env.FFMPEG_PATH, [
    "-y",
    "-i",
    sourceFilePath,
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-crf",
    "20",
    "-preset",
    "veryfast",
    "-sc_threshold",
    "0",
    "-g",
    "48",
    "-keyint_min",
    "48",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    segmentPattern,
    playlistPath,
  ]);

  await storage.putDirectory(hlsRelativeDir, hlsScratchDir);
  if (isS3Storage) await removeScratchPath(hlsRelativeDir);

  let thumbnailUrl: string | null = null;
  if (options.generateThumbnail) {
    const thumbRelativeDir = path.join("thumbnails", videoId);
    const thumbRelativePath = path.join(thumbRelativeDir, "cover.jpg");
    await ensureScratchDir(thumbRelativeDir);
    const thumbScratchPath = resolveScratchPath(thumbRelativePath);
    try {
      await runCommand(
        env.FFMPEG_PATH,
        ["-y", "-ss", "00:00:02", "-i", sourceFilePath, "-frames:v", "1", "-q:v", "3", thumbScratchPath],
        2
      );
      thumbnailUrl = await storage.putFile(thumbRelativePath, thumbScratchPath);
      if (isS3Storage) await removeScratchPath(thumbRelativeDir);
    } catch {
      thumbnailUrl = null;
    }
  }

  const duration = await probeDurationSeconds(sourceFilePath);

  return {
    hlsPlaylistUrl: storage.getPublicUrl(path.join(hlsRelativeDir, "index.m3u8")),
    thumbnailUrl,
    duration,
  };
}
