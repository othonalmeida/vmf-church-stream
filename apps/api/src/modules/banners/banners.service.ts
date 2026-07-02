import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class BannerError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "BannerError";
  }
}

export interface BannerInput {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order?: number;
  status?: "ACTIVE" | "INACTIVE";
  startsAt?: Date;
  endsAt?: Date;
}

export async function listBanners(activeOnly: boolean) {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      ...(activeOnly
        ? {
            status: "ACTIVE",
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
          }
        : {}),
    },
    orderBy: { order: "asc" },
  });
}

export async function createBanner(input: BannerInput) {
  return prisma.banner.create({
    data: {
      title: input.title,
      subtitle: input.subtitle || null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl || null,
      order: input.order ?? 0,
      status: input.status ?? "ACTIVE",
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
  });
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  try {
    return await prisma.banner.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.subtitle !== undefined ? { subtitle: input.subtitle || null } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.linkUrl !== undefined ? { linkUrl: input.linkUrl || null } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new BannerError("Banner not found", 404);
    }
    throw error;
  }
}

export async function deleteBanner(id: string) {
  try {
    await prisma.banner.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new BannerError("Banner not found", 404);
    }
    throw error;
  }
}
