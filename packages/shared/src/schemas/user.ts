import { z } from "zod";
import { ROLES } from "../constants/index";

export const roleSchema = z.enum(ROLES);

export const adminUserUpdateSchema = z.object({
  role: roleSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  name: z.string().trim().min(2).max(120).optional(),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const userQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  role: roleSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UserQuery = z.infer<typeof userQuerySchema>;
