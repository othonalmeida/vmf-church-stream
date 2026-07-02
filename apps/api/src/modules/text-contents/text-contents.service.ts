import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { sanitizeContentHtml } from "../../lib/sanitize.js";
import { toPrismaLocale, toSharedLocale } from "../../lib/locale.js";
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
  title: string;
  description: string | null;
  contentHtml: string;
  categoryId: string;
  language: "pt_BR" | "en_US" | "es_ES";
  imageUrl: string | null;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
}): TextContentDTO {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    contentHtml: content.contentHtml,
    categoryId: content.categoryId,
    language: toSharedLocale(content.language),
    imageUrl: content.imageUrl,
    status: content.status as TextContentDTO["status"],
    featured: content.featured,
    publishedAt: content.publishedAt ? content.publishedAt.toISOString() : null,
  };
}

interface ListFilters {
  categoryId?: string;
  language?: string;
  publishedOnly: boolean;
  q?: string;
}

export async function listTextContents(filters: ListFilters, pagination: PaginationQuery) {
  const where: Prisma.TextContentWhereInput = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.language ? { language: toPrismaLocale(filters.language as never) } : {}),
    ...(filters.publishedOnly ? { status: "PUBLISHED" } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
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

export async function getTextContentById(id: string, publishedOnly: boolean) {
  const content = await prisma.textContent.findUnique({ where: { id } });
  if (!content || (publishedOnly && content.status !== "PUBLISHED")) {
    throw new TextContentError("Content not found", 404);
  }
  return toDTO(content);
}

export async function createTextContent(input: TextContentInput, createdById: string) {
  const content = await prisma.textContent.create({
    data: {
      title: input.title,
      description: input.description || null,
      contentHtml: sanitizeContentHtml(input.contentHtml),
      categoryId: input.categoryId,
      language: toPrismaLocale(input.language),
      imageUrl: input.imageUrl || null,
      status: input.status,
      featured: input.featured,
      publishedAt: input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null),
      createdById,
    },
  });
  return toDTO(content);
}

export async function updateTextContent(id: string, input: TextContentUpdateInput) {
  try {
    const content = await prisma.textContent.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.contentHtml !== undefined ? { contentHtml: sanitizeContentHtml(input.contentHtml) } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.language !== undefined ? { language: toPrismaLocale(input.language) } : {}),
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

export async function deleteTextContent(id: string) {
  try {
    await prisma.textContent.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TextContentError("Content not found", 404);
    }
    throw error;
  }
}
