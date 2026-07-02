import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { toPrismaLocale, toSharedLocale } from "../../lib/locale.js";
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
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  language: "pt_BR" | "en_US" | "es_ES";
  status: string;
}): EventDTO {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    location: event.location,
    imageUrl: event.imageUrl,
    categoryId: event.categoryId,
    language: toSharedLocale(event.language),
    status: event.status as EventDTO["status"],
  };
}

interface ListFilters {
  from?: Date;
  to?: Date;
  publishedOnly: boolean;
}

export async function listEvents(filters: ListFilters) {
  const where: Prisma.EventWhereInput = {
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

export async function getEventById(id: string, publishedOnly: boolean) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || (publishedOnly && event.status !== "PUBLISHED")) {
    throw new EventError("Event not found", 404);
  }
  return toDTO(event);
}

export async function createEvent(input: EventInput, createdById: string) {
  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description || null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      location: input.location || null,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      language: toPrismaLocale(input.language),
      status: input.status,
      createdById,
    },
  });
  return toDTO(event);
}

export async function updateEvent(id: string, input: EventUpdateInput) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.location !== undefined ? { location: input.location || null } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId || null } : {}),
        ...(input.language !== undefined ? { language: toPrismaLocale(input.language) } : {}),
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

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new EventError("Event not found", 404);
    }
    throw error;
  }
}
