import { z } from "zod";
import { PUBLISH_STATUSES, SUBTITLE_LANGUAGES } from "../constants/index";

export const publishStatusSchema = z.enum(PUBLISH_STATUSES);

export const videoInputSchema = z.object({
  titlePt: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  titleEs: z.string().trim().min(1).max(200),
  descriptionPt: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionEs: z.string().trim().max(4000).optional().or(z.literal("")),
  categoryId: z.string().uuid(),
  allowDownload: z.coerce.boolean().default(false),
  status: publishStatusSchema.default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  order: z.coerce.number().int().min(0).default(0),
});
export type VideoInput = z.infer<typeof videoInputSchema>;

export const videoUpdateSchema = videoInputSchema.partial();
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;

export const subtitleLanguageSchema = z.enum(SUBTITLE_LANGUAGES);

export const videoSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  offlineOnly: z.coerce.boolean().optional(),
});
export type VideoSearchQuery = z.infer<typeof videoSearchQuerySchema>;

export const viewHistoryUpsertSchema = z.object({
  videoId: z.string().uuid(),
  watchedSeconds: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(0).optional(),
});
export type ViewHistoryUpsertInput = z.infer<typeof viewHistoryUpsertSchema>;
