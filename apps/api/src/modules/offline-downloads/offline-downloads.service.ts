import { prisma } from "../../lib/prisma.js";

export class OfflineDownloadError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "OfflineDownloadError";
  }
}

export async function requestDownload(userId: string, videoId: string, deviceId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new OfflineDownloadError("Video not found", 404);
  }
  if (video.status !== "PUBLISHED") {
    throw new OfflineDownloadError("Video is not published yet", 409);
  }
  if (!video.allowDownload) {
    throw new OfflineDownloadError("This video is not available for offline download", 403);
  }
  if (video.transcodeStatus !== "READY" || !video.hlsPlaylistUrl) {
    throw new OfflineDownloadError("Video is not ready for download yet", 409);
  }

  const download = await prisma.offlineDownload.upsert({
    where: { userId_videoId_deviceId: { userId, videoId, deviceId } },
    update: { status: "DOWNLOADED", downloadedAt: new Date() },
    create: { userId, videoId, deviceId, status: "DOWNLOADED", downloadedAt: new Date() },
  });

  return {
    download,
    video: {
      id: video.id,
      title: video.title,
      hlsPlaylistUrl: video.hlsPlaylistUrl,
      thumbnailUrl: video.thumbnailUrl,
    },
  };
}

export async function listDownloads(userId: string) {
  const downloads = await prisma.offlineDownload.findMany({
    where: { userId, status: "DOWNLOADED" },
    include: { video: true },
    orderBy: { downloadedAt: "desc" },
  });

  return downloads.map((d) => ({
    videoId: d.videoId,
    deviceId: d.deviceId,
    title: d.video.title,
    thumbnailUrl: d.video.thumbnailUrl,
    hlsPlaylistUrl: d.video.hlsPlaylistUrl,
    downloadedAt: d.downloadedAt ? d.downloadedAt.toISOString() : null,
  }));
}

export async function removeDownload(userId: string, videoId: string, deviceId: string) {
  await prisma.offlineDownload.deleteMany({ where: { userId, videoId, deviceId } });
}
