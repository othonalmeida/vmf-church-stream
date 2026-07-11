import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { toSharedLocale } from "../../lib/locale.js";
import { toSkipTake, toPaginatedResult } from "../../lib/pagination.js";
import type { VideoInput, VideoUpdateInput, VideoDTO, PaginationQuery, SubtitleDTO } from "@vmf/shared";

export class VideoError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "VideoError";
  }
}

type VideoWithSubtitles = Prisma.VideoGetPayload<{ include: { subtitles: true } }>;

function toDTO(video: VideoWithSubtitles): VideoDTO {
  return {
    id: video.id,
    titlePt: video.titlePt,
    titleEn: video.titleEn,
    titleEs: video.titleEs,
    descriptionPt: video.descriptionPt,
    descriptionEn: video.descriptionEn,
    descriptionEs: video.descriptionEs,
    categoryId: video.categoryId,
    thumbnailUrl: video.thumbnailUrl,
    hlsPlaylistUrl: video.hlsPlaylistUrl,
    duration: video.duration,
    allowDownload: video.allowDownload,
    status: video.status as VideoDTO["status"],
    featured: video.featured,
    order: video.order,
    publishedAt: video.publishedAt ? video.publishedAt.toISOString() : null,
    transcodeStatus: video.transcodeStatus as VideoDTO["transcodeStatus"],
    subtitles: video.subtitles.map(
      (s): SubtitleDTO => ({
        id: s.id,
        videoId: s.videoId,
        language: toSharedLocale(s.language),
        fileUrl: s.fileUrl,
        status: s.status as SubtitleDTO["status"],
      })
    ),
    createdAt: video.createdAt.toISOString(),
  };
}

interface ListFilters {
  categoryId?: string;
  offlineOnly?: boolean;
  q?: string;
  publishedOnly: boolean;
}

export async function listVideos(churchId: number, filters: ListFilters, pagination: PaginationQuery) {
  const where: Prisma.VideoWhereInput = {
    churchId,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.offlineOnly ? { allowDownload: true } : {}),
    ...(filters.publishedOnly ? { status: "PUBLISHED" } : {}),
    ...(filters.q
      ? {
          OR: [
            { titlePt: { contains: filters.q, mode: "insensitive" } },
            { titleEn: { contains: filters.q, mode: "insensitive" } },
            { titleEs: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: { subtitles: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { publishedAt: "desc" }],
      ...toSkipTake(pagination),
    }),
    prisma.video.count({ where }),
  ]);

  return toPaginatedResult(items.map(toDTO), total, pagination);
}

export async function getVideoById(id: string, churchId: number, publishedOnly: boolean) {
  const video = await prisma.video.findFirst({ where: { id, churchId }, include: { subtitles: true } });
  if (!video || (publishedOnly && video.status !== "PUBLISHED")) {
    throw new VideoError("Video not found", 404);
  }
  return toDTO(video);
}

export async function createVideo(input: VideoInput, createdById: string, churchId: number) {
  const video = await prisma.video.create({
    data: {
      titlePt: input.titlePt,
      titleEn: input.titleEn,
      titleEs: input.titleEs,
      descriptionPt: input.descriptionPt || null,
      descriptionEn: input.descriptionEn || null,
      descriptionEs: input.descriptionEs || null,
      categoryId: input.categoryId,
      allowDownload: input.allowDownload,
      status: input.status,
      featured: input.featured,
      order: input.order,
      publishedAt: input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null),
      createdById,
      churchId,
    },
    include: { subtitles: true },
  });
  return toDTO(video);
}

export async function updateVideo(id: string, churchId: number, input: VideoUpdateInput) {
  try {
    const video = await prisma.video.update({
      where: { id, churchId },
      data: {
        ...(input.titlePt !== undefined ? { titlePt: input.titlePt } : {}),
        ...(input.titleEn !== undefined ? { titleEn: input.titleEn } : {}),
        ...(input.titleEs !== undefined ? { titleEs: input.titleEs } : {}),
        ...(input.descriptionPt !== undefined ? { descriptionPt: input.descriptionPt || null } : {}),
        ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn || null } : {}),
        ...(input.descriptionEs !== undefined ? { descriptionEs: input.descriptionEs || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.allowDownload !== undefined ? { allowDownload: input.allowDownload } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
      },
      include: { subtitles: true },
    });
    return toDTO(video);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new VideoError("Video not found", 404);
    }
    throw error;
  }
}

export async function deleteVideo(id: string, churchId: number) {
  try {
    await prisma.video.delete({ where: { id, churchId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new VideoError("Video not found", 404);
    }
    throw error;
  }
}

export async function getVideoOrThrow(id: string, churchId: number) {
  const video = await prisma.video.findFirst({ where: { id, churchId } });
  if (!video) throw new VideoError("Video not found", 404);
  return video;
}

export async function markVideoUploaded(id: string, churchId: number, sourceFilePath: string) {
  await prisma.video.update({
    where: { id, churchId },
    data: { sourceFilePath, transcodeStatus: "PENDING", transcodeError: null },
  });
}
