import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { toSharedLocale } from "../../lib/locale.js";
import { toSkipTake, toPaginatedResult } from "../../lib/pagination.js";
import type { AdminUserUpdateInput, UserQuery, PaginationQuery, UserDTO } from "@vmf/shared";

export class UserError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "UserError";
  }
}

function toDTO(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  preferredLocale: "pt_BR" | "en_US" | "es_ES";
  churchId: number;
  createdAt: Date;
}): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    preferredLocale: toSharedLocale(user.preferredLocale),
    churchId: user.churchId,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsers(churchId: number, filters: UserQuery, pagination: PaginationQuery) {
  const where: Prisma.UserWhereInput = {
    churchId,
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, ...toSkipTake(pagination) }),
    prisma.user.count({ where }),
  ]);

  return toPaginatedResult(users.map(toDTO), total, pagination);
}

export async function updateUser(id: string, churchId: number, input: AdminUserUpdateInput) {
  try {
    const user = await prisma.user.update({
      where: { id, churchId },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
    });
    return toDTO(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new UserError("User not found", 404);
    }
    throw error;
  }
}
