import { z } from "zod";
import { localeSchema } from "./common";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  preferredLocale: localeSchema.optional(),
  churchId: z.number().int(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  preferredLocale: localeSchema.optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional(),
}).refine(
  (data) => !data.newPassword || !!data.currentPassword,
  { message: "currentPassword is required to set newPassword", path: ["currentPassword"] }
);
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  // So presente quando o cliente envia o header "X-Client: mobile" - apps
  // nativos nao tem cookie jar de navegador, entao o refresh token viaja no
  // corpo em vez de (ou alem de) um cookie httpOnly.
  refreshToken: z.string().optional(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});
export type RefreshRequestInput = z.infer<typeof refreshRequestSchema>;
