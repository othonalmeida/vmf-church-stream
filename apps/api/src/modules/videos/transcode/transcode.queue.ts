import pLimit from "p-limit";
import { prisma } from "../../../lib/prisma.js";
import { env } from "../../../env.js";
import { transcodeVideoToHls } from "./transcode.worker.js";

const limiter = pLimit(env.TRANSCODE_CONCURRENCY);

async function runJob(videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || !video.sourceFilePath) return;

  await prisma.video.update({ where: { id: videoId }, data: { transcodeStatus: "PROCESSING", transcodeError: null } });

  try {
    const result = await transcodeVideoToHls(videoId, video.sourceFilePath, {
      generateThumbnail: !video.thumbnailUrl,
    });
    await prisma.video.update({
      where: { id: videoId },
      data: {
        hlsPlaylistUrl: result.hlsPlaylistUrl,
        thumbnailUrl: video.thumbnailUrl ?? result.thumbnailUrl,
        duration: result.duration ?? video.duration,
        transcodeStatus: "READY",
        transcodeError: null,
      },
    });
  } catch (error) {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        transcodeStatus: "FAILED",
        transcodeError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown transcode error",
      },
    });
  }
}

export function enqueueTranscode(videoId: string) {
  limiter(() => runJob(videoId)).catch(() => {
    // Errors are already persisted on the Video record inside runJob.
  });
}

/**
 * On boot, any video left in PENDING/PROCESSING means the process restarted
 * mid-job (in-memory queue, no external broker). Re-enqueue those so they don't
 * get stuck forever; safe to call repeatedly since ffmpeg overwrites its own output.
 */
export async function recoverStuckTranscodes() {
  const stuck = await prisma.video.findMany({
    where: { transcodeStatus: { in: ["PENDING", "PROCESSING"] }, sourceFilePath: { not: null } },
    select: { id: true },
  });
  for (const video of stuck) {
    enqueueTranscode(video.id);
  }
  return stuck.length;
}
