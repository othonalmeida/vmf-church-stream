import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  issuePasswordResetToken,
  consumePasswordResetToken,
} from "../../lib/auth/tokens";
import { toPrismaLocale, toSharedLocale } from "../../lib/locale";
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "@vmf/shared";
import { DEFAULT_LOCALE, type UserDTO } from "@vmf/shared";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

function toUserDTO(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  preferredLocale: "pt_BR" | "en_US" | "es_ES";
  createdAt: Date;
}): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    preferredLocale: toSharedLocale(user.preferredLocale),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AuthError("E-mail already registered", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      preferredLocale: toPrismaLocale(input.preferredLocale ?? DEFAULT_LOCALE),
      role: "MEMBER",
    },
  });

  const refreshToken = await issueRefreshToken(user.id);
  return { user: toUserDTO(user), refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AuthError("Invalid credentials");
  }
  if (user.status === "INACTIVE") {
    throw new AuthError("Account is inactive", 403);
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid credentials");
  }

  const refreshToken = await issueRefreshToken(user.id);
  return { user: toUserDTO(user), refreshToken };
}

export async function refreshSession(oldRefreshToken: string) {
  const rotated = await rotateRefreshToken(oldRefreshToken);
  if (!rotated) {
    throw new AuthError("Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user || user.status === "INACTIVE") {
    throw new AuthError("Account not found or inactive", 403);
  }
  return { user: toUserDTO(user), refreshToken: rotated.token };
}

export async function logoutUser(refreshToken: string | undefined) {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not leak whether the e-mail exists.
    return null;
  }
  const token = await issuePasswordResetToken(user.id);
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    throw new AuthError("Invalid or expired reset token", 400);
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AuthError("User not found", 404);
  }
  return toUserDTO(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthError("User not found", 404);
  }

  const data: {
    name?: string;
    preferredLocale?: "pt_BR" | "en_US" | "es_ES";
    passwordHash?: string;
  } = {};

  if (input.name) data.name = input.name;
  if (input.preferredLocale) data.preferredLocale = toPrismaLocale(input.preferredLocale);

  if (input.newPassword) {
    const valid = await verifyPassword(input.currentPassword!, user.passwordHash);
    if (!valid) {
      throw new AuthError("Current password is incorrect", 400);
    }
    data.passwordHash = await hashPassword(input.newPassword);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return toUserDTO(updated);
}
