import { z } from "zod";
import { publishStatusSchema } from "./video";

export const textContentInputSchema = z.object({
  titlePt: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  titleEs: z.string().trim().min(1).max(200),
  descriptionPt: z.string().trim().max(500).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(500).optional().or(z.literal("")),
  descriptionEs: z.string().trim().max(500).optional().or(z.literal("")),
  contentHtmlPt: z.string().min(1),
  contentHtmlEn: z.string().min(1),
  contentHtmlEs: z.string().min(1),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: publishStatusSchema.default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
});
export type TextContentInput = z.infer<typeof textContentInputSchema>;

export const textContentUpdateSchema = textContentInputSchema.partial();
export type TextContentUpdateInput = z.infer<typeof textContentUpdateSchema>;
