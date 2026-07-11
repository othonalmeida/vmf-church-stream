import { prisma } from "../../lib/prisma.js";

export interface SearchResultItem {
  id: string;
  type: "VIDEO" | "TRAINING" | "TEXT" | "EVENT";
  titlePt: string;
  titleEn: string;
  titleEs: string;
  descriptionPt: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
}

interface SearchFilters {
  q?: string;
  categoryId?: string;
  types?: SearchResultItem["type"][];
  offlineOnly?: boolean;
}

function matchTitle(q: string) {
  return {
    OR: [
      { titlePt: { contains: q, mode: "insensitive" as const } },
      { titleEn: { contains: q, mode: "insensitive" as const } },
      { titleEs: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export async function globalSearch(churchId: number, filters: SearchFilters): Promise<SearchResultItem[]> {
  const q = filters.q?.trim();
  const wantsType = (type: SearchResultItem["type"]) => !filters.types || filters.types.includes(type);

  const results: SearchResultItem[] = [];

  if (wantsType("VIDEO")) {
    const videos = await prisma.video.findMany({
      where: {
        churchId,
        status: "PUBLISHED",
        ...(q ? matchTitle(q) : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.offlineOnly ? { allowDownload: true } : {}),
      },
      take: 20,
    });
    results.push(
      ...videos.map((v) => ({
        id: v.id,
        type: "VIDEO" as const,
        titlePt: v.titlePt,
        titleEn: v.titleEn,
        titleEs: v.titleEs,
        descriptionPt: v.descriptionPt,
        descriptionEn: v.descriptionEn,
        descriptionEs: v.descriptionEs,
        thumbnailUrl: v.thumbnailUrl,
        categoryId: v.categoryId,
      }))
    );
  }

  if (wantsType("TRAINING") && !filters.offlineOnly) {
    const trainings = await prisma.training.findMany({
      where: {
        churchId,
        status: "PUBLISHED",
        ...(q ? matchTitle(q) : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      take: 20,
    });
    results.push(
      ...trainings.map((t) => ({
        id: t.id,
        type: "TRAINING" as const,
        titlePt: t.titlePt,
        titleEn: t.titleEn,
        titleEs: t.titleEs,
        descriptionPt: t.descriptionPt,
        descriptionEn: t.descriptionEn,
        descriptionEs: t.descriptionEs,
        thumbnailUrl: t.imageUrl,
        categoryId: t.categoryId,
      }))
    );
  }

  if (wantsType("TEXT") && !filters.offlineOnly) {
    const texts = await prisma.textContent.findMany({
      where: {
        churchId,
        status: "PUBLISHED",
        ...(q ? matchTitle(q) : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      take: 20,
    });
    results.push(
      ...texts.map((t) => ({
        id: t.id,
        type: "TEXT" as const,
        titlePt: t.titlePt,
        titleEn: t.titleEn,
        titleEs: t.titleEs,
        descriptionPt: t.descriptionPt,
        descriptionEn: t.descriptionEn,
        descriptionEs: t.descriptionEs,
        thumbnailUrl: t.imageUrl,
        categoryId: t.categoryId,
      }))
    );
  }

  if (wantsType("EVENT") && !filters.offlineOnly) {
    const events = await prisma.event.findMany({
      where: {
        churchId,
        status: "PUBLISHED",
        ...(q ? matchTitle(q) : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      take: 20,
    });
    results.push(
      ...events.map((e) => ({
        id: e.id,
        type: "EVENT" as const,
        titlePt: e.titlePt,
        titleEn: e.titleEn,
        titleEs: e.titleEs,
        descriptionPt: e.descriptionPt,
        descriptionEn: e.descriptionEn,
        descriptionEs: e.descriptionEs,
        thumbnailUrl: e.imageUrl,
        categoryId: e.categoryId,
      }))
    );
  }

  return results;
}
