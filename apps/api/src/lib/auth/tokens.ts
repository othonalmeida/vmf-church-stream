import { randomBytes, createHash } from "node:crypto";
import { REFRESH_TOKEN_TTL_DAYS, PASSWORD_RESET_TTL_MINUTES } from "@vmf/shared";
import { prisma } from "../prisma";

export function generateOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ userId: string; token: string } | null> {
  const tokenHash = hashToken(oldToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });
  const token = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, token };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const existing = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
    return null;
  }
  await prisma.passwordResetToken.update({
    where: { id: existing.id },
    data: { usedAt: new Date() },
  });
  return existing.userId;
}
