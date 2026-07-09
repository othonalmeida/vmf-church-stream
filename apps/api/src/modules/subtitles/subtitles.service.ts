import { prisma } from "../../lib/prisma.js";
import { toPrismaLocale } from "../../lib/locale.js";
import type { Locale as SharedLocale } from "@vmf/shared";

export class SubtitleError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "SubtitleError";
  }
}

export async function upsertSubtitle(videoId: string, churchId: number, language: SharedLocale, fileUrl: string) {
  const video = await prisma.video.findFirst({ where: { id: videoId, churchId } });
  if (!video) throw new SubtitleError("Video not found", 404);

  const subtitle = await prisma.subtitle.upsert({
    where: { videoId_language: { videoId, language: toPrismaLocale(language) } },
    update: { fileUrl, status: "ACTIVE" },
    create: { videoId, language: toPrismaLocale(language), fileUrl, status: "ACTIVE" },
  });
  return subtitle;
}

export async function deleteSubtitle(videoId: string, churchId: number, subtitleId: string) {
  const video = await prisma.video.findFirst({ where: { id: videoId, churchId } });
  if (!video) throw new SubtitleError("Video not found", 404);
  const subtitle = await prisma.subtitle.findUnique({ where: { id: subtitleId } });
  if (!subtitle || subtitle.videoId !== videoId) {
    throw new SubtitleError("Subtitle not found", 404);
  }
  await prisma.subtitle.delete({ where: { id: subtitleId } });
}
