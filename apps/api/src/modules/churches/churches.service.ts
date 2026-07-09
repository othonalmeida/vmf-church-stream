import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { ChurchInput, ChurchUpdateInput, ChurchDTO } from "@vmf/shared";

export class ChurchError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ChurchError";
  }
}

function toDTO(church: { id: number; name: string }): ChurchDTO {
  return { id: church.id, name: church.name };
}

export async function listChurches() {
  const churches = await prisma.church.findMany({ orderBy: { name: "asc" } });
  return churches.map(toDTO);
}

export async function createChurch(input: ChurchInput) {
  const church = await prisma.church.create({ data: { name: input.name } });
  return toDTO(church);
}

export async function updateChurch(id: number, input: ChurchUpdateInput) {
  try {
    const church = await prisma.church.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
    });
    return toDTO(church);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ChurchError("Church not found", 404);
    }
    throw error;
  }
}

export async function deleteChurch(id: number) {
  try {
    await prisma.church.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new ChurchError("Church not found", 404);
      if (error.code === "P2003") {
        throw new ChurchError("Church is in use and cannot be deleted.", 409);
      }
    }
    throw error;
  }
}
