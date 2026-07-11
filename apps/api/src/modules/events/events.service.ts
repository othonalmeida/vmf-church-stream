import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { EventInput, EventUpdateInput, EventDTO } from "@vmf/shared";

export class EventError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "EventError";
  }
}

function toDTO(event: {
  id: string;
  titlePt: string;
  titleEn: string;
  titleEs: string;
  descriptionPt: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  status: string;
}): EventDTO {
  return {
    id: event.id,
    titlePt: event.titlePt,
    titleEn: event.titleEn,
    titleEs: event.titleEs,
    descriptionPt: event.descriptionPt,
    descriptionEn: event.descriptionEn,
    descriptionEs: event.descriptionEs,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    location: event.location,
    imageUrl: event.imageUrl,
    categoryId: event.categoryId,
    status: event.status as EventDTO["status"],
  };
}

interface ListFilters {
  from?: Date;
  to?: Date;
  publishedOnly: boolean;
}

export async function listEvents(churchId: number, filters: ListFilters) {
  const where: Prisma.EventWhereInput = {
    churchId,
    ...(filters.publishedOnly ? { status: "PUBLISHED" } : {}),
    ...(filters.from || filters.to
      ? {
          startDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const events = await prisma.event.findMany({ where, orderBy: { startDate: "asc" } });
  return events.map(toDTO);
}

export async function getEventById(id: string, churchId: number, publishedOnly: boolean) {
  const event = await prisma.event.findFirst({ where: { id, churchId } });
  if (!event || (publishedOnly && event.status !== "PUBLISHED")) {
    throw new EventError("Event not found", 404);
  }
  return toDTO(event);
}

export async function createEvent(input: EventInput, createdById: string, churchId: number) {
  const event = await prisma.event.create({
    data: {
      titlePt: input.titlePt,
      titleEn: input.titleEn,
      titleEs: input.titleEs,
      descriptionPt: input.descriptionPt || null,
      descriptionEn: input.descriptionEn || null,
      descriptionEs: input.descriptionEs || null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      location: input.location || null,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      status: input.status,
      createdById,
      churchId,
    },
  });
  return toDTO(event);
}

export async function updateEvent(id: string, churchId: number, input: EventUpdateInput) {
  try {
    const event = await prisma.event.update({
      where: { id, churchId },
      data: {
        ...(input.titlePt !== undefined ? { titlePt: input.titlePt } : {}),
        ...(input.titleEn !== undefined ? { titleEn: input.titleEn } : {}),
        ...(input.titleEs !== undefined ? { titleEs: input.titleEs } : {}),
        ...(input.descriptionPt !== undefined ? { descriptionPt: input.descriptionPt || null } : {}),
        ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn || null } : {}),
        ...(input.descriptionEs !== undefined ? { descriptionEs: input.descriptionEs || null } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.location !== undefined ? { location: input.location || null } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    return toDTO(event);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new EventError("Event not found", 404);
    }
    throw error;
  }
}

export async function deleteEvent(id: string, churchId: number) {
  try {
    await prisma.event.delete({ where: { id, churchId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new EventError("Event not found", 404);
    }
    throw error;
  }
}
