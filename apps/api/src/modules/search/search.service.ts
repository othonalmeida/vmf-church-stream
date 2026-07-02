import { prisma } from "../../lib/prisma.js";
import { toPrismaLocale } from "../../lib/locale.js";
import type { Locale as SharedLocale } from "@vmf/shared";

export interface SearchResultItem {
  id: string;
  type: "VIDEO" | "TRAINING" | "TEXT" | "EVENT";
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
}

interface SearchFilters {
  q?: string;
  categoryId?: string;
  language?: SharedLocale;
  types?: SearchResultItem["type"][];
  offlineOnly?: boolean;
}

export async function globalSearch(filters: SearchFilters): Promise<SearchResultItem[]> {
  const q = filters.q?.trim();
  const wantsType = (type: SearchResultItem["type"]) => !filters.types || filters.types.includes(type);
  const language = filters.language ? toPrismaLocale(filters.language) : undefined;

  const results: SearchResultItem[] = [];

  if (wantsType("VIDEO")) {
    const videos = await prisma.video.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(language ? { originalLanguage: language } : {}),
        ...(filters.offlineOnly ? { allowDownload: true } : {}),
      },
      take: 20,
    });
    results.push(
      ...videos.map((v) => ({
        id: v.id,
        type: "VIDEO" as const,
        title: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        categoryId: v.categoryId,
      }))
    );
  }

  if (wantsType("TRAINING") && !filters.offlineOnly) {
    const trainings = await prisma.training.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      take: 20,
    });
    results.push(
      ...trainings.map((t) => ({
        id: t.id,
        type: "TRAINING" as const,
        title: t.title,
        description: t.description,
        thumbnailUrl: t.imageUrl,
        categoryId: t.categoryId,
      }))
    );
  }

  if (wantsType("TEXT") && !filters.offlineOnly) {
    const texts = await prisma.textContent.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(language ? { language } : {}),
      },
      take: 20,
    });
    results.push(
      ...texts.map((t) => ({
        id: t.id,
        type: "TEXT" as const,
        title: t.title,
        description: t.description,
        thumbnailUrl: t.imageUrl,
        categoryId: t.categoryId,
      }))
    );
  }

  if (wantsType("EVENT") && !filters.offlineOnly) {
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(language ? { language } : {}),
      },
      take: 20,
    });
    results.push(
      ...events.map((e) => ({
        id: e.id,
        type: "EVENT" as const,
        title: e.title,
        description: e.description,
        thumbnailUrl: e.imageUrl,
        categoryId: e.categoryId,
      }))
    );
  }

  return results;
}
