import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CategoryInput, CategoryUpdateInput, CategoryDTO } from "@vmf/shared";

export class CategoryError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CategoryError";
  }
}

function toDTO(category: {
  id: string;
  namePt: string;
  nameEn: string;
  nameEs: string;
  description: string | null;
  contentType: string;
  order: number;
  status: string;
}): CategoryDTO {
  return {
    id: category.id,
    namePt: category.namePt,
    nameEn: category.nameEn,
    nameEs: category.nameEs,
    description: category.description,
    contentType: category.contentType as CategoryDTO["contentType"],
    order: category.order,
    status: category.status as CategoryDTO["status"],
  };
}

export async function listCategories(filters: { contentType?: string; includeInactive?: boolean }) {
  const categories = await prisma.category.findMany({
    where: {
      ...(filters.contentType ? { contentType: filters.contentType as never } : {}),
      ...(filters.includeInactive ? {} : { status: "ACTIVE" }),
    },
    orderBy: [{ order: "asc" }, { namePt: "asc" }],
  });
  return categories.map(toDTO);
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new CategoryError("Category not found", 404);
  return toDTO(category);
}

export async function createCategory(input: CategoryInput) {
  const category = await prisma.category.create({
    data: {
      namePt: input.namePt,
      nameEn: input.nameEn,
      nameEs: input.nameEs,
      description: input.description || null,
      contentType: input.contentType,
      order: input.order,
      status: input.status,
    },
  });
  return toDTO(category);
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.namePt !== undefined ? { namePt: input.namePt } : {}),
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
        ...(input.nameEs !== undefined ? { nameEs: input.nameEs } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.contentType !== undefined ? { contentType: input.contentType } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new CategoryError("Category not found", 404);
    }
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new CategoryError("Category not found", 404);
      if (error.code === "P2003") {
        throw new CategoryError("Category is in use and cannot be deleted. Deactivate it instead.", 409);
      }
    }
    throw error;
  }
}
