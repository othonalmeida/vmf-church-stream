import { prisma } from "../../lib/prisma.js";

export class ViewHistoryError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ViewHistoryError";
  }
}

export async function upsertViewHistory(
  userId: string,
  videoId: string,
  watchedSeconds: number,
  durationSeconds?: number
) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new ViewHistoryError("Video not found", 404);

  const total = durationSeconds ?? video.duration ?? 0;
  const percentualWatched = total > 0 ? Math.min(100, Math.round((watchedSeconds / total) * 100)) : 0;
  const completed = percentualWatched >= 90;

  await prisma.viewHistory.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: { watchedSeconds, percentualWatched, completed, lastViewedAt: new Date() },
    create: { userId, videoId, watchedSeconds, percentualWatched, completed },
  });
}

export async function listContinueWatching(userId: string) {
  const history = await prisma.viewHistory.findMany({
    where: { userId, completed: false, watchedSeconds: { gt: 0 } },
    include: { video: { include: { subtitles: true } } },
    orderBy: { lastViewedAt: "desc" },
    take: 20,
  });

  return history
    .filter((h) => h.video.status === "PUBLISHED")
    .map((h) => ({
      videoId: h.videoId,
      title: h.video.title,
      thumbnailUrl: h.video.thumbnailUrl,
      watchedSeconds: h.watchedSeconds,
      percentualWatched: h.percentualWatched,
      lastViewedAt: h.lastViewedAt.toISOString(),
    }));
}

export async function getVideoProgress(userId: string, videoId: string) {
  const history = await prisma.viewHistory.findUnique({ where: { userId_videoId: { userId, videoId } } });
  return history ? { watchedSeconds: history.watchedSeconds, percentualWatched: history.percentualWatched } : null;
}
