import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { sanitizeContentHtml } from "../../lib/sanitize.js";
import { toSkipTake, toPaginatedResult } from "../../lib/pagination.js";
import type { TextContentInput, TextContentUpdateInput, TextContentDTO, PaginationQuery } from "@vmf/shared";

export class TextContentError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TextContentError";
  }
}

function toDTO(content: {
  id: string;
  titlePt: string;
  titleEn: string;
  titleEs: string;
  descriptionPt: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  contentHtmlPt: string;
  contentHtmlEn: string;
  contentHtmlEs: string;
  categoryId: string;
  imageUrl: string | null;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
}): TextContentDTO {
  return {
    id: content.id,
    titlePt: content.titlePt,
    titleEn: content.titleEn,
    titleEs: content.titleEs,
    descriptionPt: content.descriptionPt,
    descriptionEn: content.descriptionEn,
    descriptionEs: content.descriptionEs,
    contentHtmlPt: content.contentHtmlPt,
    contentHtmlEn: content.contentHtmlEn,
    contentHtmlEs: content.contentHtmlEs,
    categoryId: content.categoryId,
    imageUrl: content.imageUrl,
    status: content.status as TextContentDTO["status"],
    featured: content.featured,
    publishedAt: content.publishedAt ? content.publishedAt.toISOString() : null,
  };
}

interface ListFilters {
  categoryId?: string;
  publishedOnly: boolean;
  q?: string;
}

export async function listTextContents(churchId: number, filters: ListFilters, pagination: PaginationQuery) {
  const where: Prisma.TextContentWhereInput = {
    churchId,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
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
    prisma.textContent.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      ...toSkipTake(pagination),
    }),
    prisma.textContent.count({ where }),
  ]);

  return toPaginatedResult(items.map(toDTO), total, pagination);
}

export async function getTextContentById(id: string, churchId: number, publishedOnly: boolean) {
  const content = await prisma.textContent.findFirst({ where: { id, churchId } });
  if (!content || (publishedOnly && content.status !== "PUBLISHED")) {
    throw new TextContentError("Content not found", 404);
  }
  return toDTO(content);
}

export async function createTextContent(input: TextContentInput, createdById: string, churchId: number) {
  const content = await prisma.textContent.create({
    data: {
      titlePt: input.titlePt,
      titleEn: input.titleEn,
      titleEs: input.titleEs,
      descriptionPt: input.descriptionPt || null,
      descriptionEn: input.descriptionEn || null,
      descriptionEs: input.descriptionEs || null,
      contentHtmlPt: sanitizeContentHtml(input.contentHtmlPt),
      contentHtmlEn: sanitizeContentHtml(input.contentHtmlEn),
      contentHtmlEs: sanitizeContentHtml(input.contentHtmlEs),
      categoryId: input.categoryId,
      imageUrl: input.imageUrl || null,
      status: input.status,
      featured: input.featured,
      publishedAt: input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null),
      createdById,
      churchId,
    },
  });
  return toDTO(content);
}

export async function updateTextContent(id: string, churchId: number, input: TextContentUpdateInput) {
  try {
    const content = await prisma.textContent.update({
      where: { id, churchId },
      data: {
        ...(input.titlePt !== undefined ? { titlePt: input.titlePt } : {}),
        ...(input.titleEn !== undefined ? { titleEn: input.titleEn } : {}),
        ...(input.titleEs !== undefined ? { titleEs: input.titleEs } : {}),
        ...(input.descriptionPt !== undefined ? { descriptionPt: input.descriptionPt || null } : {}),
        ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn || null } : {}),
        ...(input.descriptionEs !== undefined ? { descriptionEs: input.descriptionEs || null } : {}),
        ...(input.contentHtmlPt !== undefined ? { contentHtmlPt: sanitizeContentHtml(input.contentHtmlPt) } : {}),
        ...(input.contentHtmlEn !== undefined ? { contentHtmlEn: sanitizeContentHtml(input.contentHtmlEn) } : {}),
        ...(input.contentHtmlEs !== undefined ? { contentHtmlEs: sanitizeContentHtml(input.contentHtmlEs) } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
      },
    });
    return toDTO(content);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TextContentError("Content not found", 404);
    }
    throw error;
  }
}

export async function deleteTextContent(id: string, churchId: number) {
  try {
    await prisma.textContent.delete({ where: { id, churchId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TextContentError("Content not found", 404);
    }
    throw error;
  }
}
