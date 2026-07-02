import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { toPrismaLocale, toSharedLocale } from "../../lib/locale.js";
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
    title: video.title,
    description: video.description,
    categoryId: video.categoryId,
    thumbnailUrl: video.thumbnailUrl,
    hlsPlaylistUrl: video.hlsPlaylistUrl,
    duration: video.duration,
    originalLanguage: toSharedLocale(video.originalLanguage),
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
  language?: string;
  offlineOnly?: boolean;
  q?: string;
  publishedOnly: boolean;
}

export async function listVideos(filters: ListFilters, pagination: PaginationQuery) {
  const where: Prisma.VideoWhereInput = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.language ? { originalLanguage: toPrismaLocale(filters.language as never) } : {}),
    ...(filters.offlineOnly ? { allowDownload: true } : {}),
    ...(filters.publishedOnly ? { status: "PUBLISHED" } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
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

export async function getVideoById(id: string, publishedOnly: boolean) {
  const video = await prisma.video.findUnique({ where: { id }, include: { subtitles: true } });
  if (!video || (publishedOnly && video.status !== "PUBLISHED")) {
    throw new VideoError("Video not found", 404);
  }
  return toDTO(video);
}

export async function createVideo(input: VideoInput, createdById: string) {
  const video = await prisma.video.create({
    data: {
      title: input.title,
      description: input.description || null,
      categoryId: input.categoryId,
      originalLanguage: toPrismaLocale(input.originalLanguage),
      allowDownload: input.allowDownload,
      status: input.status,
      featured: input.featured,
      order: input.order,
      publishedAt: input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null),
      createdById,
    },
    include: { subtitles: true },
  });
  return toDTO(video);
}

export async function updateVideo(id: string, input: VideoUpdateInput) {
  try {
    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.originalLanguage !== undefined ? { originalLanguage: toPrismaLocale(input.originalLanguage) } : {}),
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

export async function deleteVideo(id: string) {
  try {
    await prisma.video.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new VideoError("Video not found", 404);
    }
    throw error;
  }
}

export async function getVideoOrThrow(id: string) {
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) throw new VideoError("Video not found", 404);
  return video;
}

export async function markVideoUploaded(id: string, sourceFilePath: string) {
  await prisma.video.update({
    where: { id },
    data: { sourceFilePath, transcodeStatus: "PENDING", transcodeError: null },
  });
}
