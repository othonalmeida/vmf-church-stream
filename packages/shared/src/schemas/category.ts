import { z } from "zod";
import { CONTENT_TYPES } from "../constants/index";

export const categoryContentTypeSchema = z.enum(CONTENT_TYPES);

export const categoryInputSchema = z.object({
  namePt: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  nameEs: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  contentType: categoryContentTypeSchema,
  order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryUpdateSchema = categoryInputSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
