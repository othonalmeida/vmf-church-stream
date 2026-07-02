import { z } from "zod";
import { localeSchema } from "./common";
import { publishStatusSchema } from "./video";

export const textContentInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  contentHtml: z.string().min(1),
  categoryId: z.string().uuid(),
  language: localeSchema,
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: publishStatusSchema.default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
});
export type TextContentInput = z.infer<typeof textContentInputSchema>;

export const textContentUpdateSchema = textContentInputSchema.partial();
export type TextContentUpdateInput = z.infer<typeof textContentUpdateSchema>;
