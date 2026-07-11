import { prisma } from "../../lib/prisma.js";
import type { FavoritableTypeName } from "@vmf/shared";

export class FavoriteError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "FavoriteError";
  }
}

export interface FavoriteItem {
  id: string;
  contentType: FavoritableTypeName;
  contentId: string;
  titlePt: string;
  titleEn: string;
  titleEs: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

async function resolveContent(contentType: FavoritableTypeName, contentId: string) {
  switch (contentType) {
    case "VIDEO": {
      const video = await prisma.video.findUnique({ where: { id: contentId } });
      return video
        ? { titlePt: video.titlePt, titleEn: video.titleEn, titleEs: video.titleEs, thumbnailUrl: video.thumbnailUrl }
        : null;
    }
    case "TRAINING": {
      const training = await prisma.training.findUnique({ where: { id: contentId } });
      return training
        ? { titlePt: training.titlePt, titleEn: training.titleEn, titleEs: training.titleEs, thumbnailUrl: training.imageUrl }
        : null;
    }
    case "TEXT": {
      const text = await prisma.textContent.findUnique({ where: { id: contentId } });
      return text
        ? { titlePt: text.titlePt, titleEn: text.titleEn, titleEs: text.titleEs, thumbnailUrl: text.imageUrl }
        : null;
    }
    case "EVENT": {
      const event = await prisma.event.findUnique({ where: { id: contentId } });
      return event
        ? { titlePt: event.titlePt, titleEn: event.titleEn, titleEs: event.titleEs, thumbnailUrl: event.imageUrl }
        : null;
    }
    default:
      return null;
  }
}

export async function listFavorites(userId: string): Promise<FavoriteItem[]> {
  const favorites = await prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  const resolved = await Promise.all(
    favorites.map(async (fav) => {
      const content = await resolveContent(fav.contentType as FavoritableTypeName, fav.contentId);
      if (!content) return null;
      return {
        id: fav.id,
        contentType: fav.contentType as FavoritableTypeName,
        contentId: fav.contentId,
        titlePt: content.titlePt,
        titleEn: content.titleEn,
        titleEs: content.titleEs,
        thumbnailUrl: content.thumbnailUrl,
        createdAt: fav.createdAt.toISOString(),
      };
    })
  );

  return resolved.filter((item): item is FavoriteItem => item !== null);
}

export async function addFavorite(userId: string, contentType: FavoritableTypeName, contentId: string) {
  const content = await resolveContent(contentType, contentId);
  if (!content) throw new FavoriteError("Content not found", 404);

  await prisma.favorite.upsert({
    where: { userId_contentType_contentId: { userId, contentType, contentId } },
    update: {},
    create: { userId, contentType, contentId },
  });
}

export async function removeFavorite(userId: string, contentType: FavoritableTypeName, contentId: string) {
  await prisma.favorite.deleteMany({ where: { userId, contentType, contentId } });
}
