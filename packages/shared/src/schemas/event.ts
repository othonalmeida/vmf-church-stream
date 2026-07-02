import { z } from "zod";
import { localeSchema } from "./common";
import { publishStatusSchema } from "./video";

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    imageUrl: z.string().url().optional().or(z.literal("")),
    categoryId: z.string().uuid().optional(),
    language: localeSchema,
    status: publishStatusSchema.default("DRAFT"),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });
export type EventInput = z.infer<typeof eventInputSchema>;

export const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional(),
  language: localeSchema.optional(),
  status: publishStatusSchema.optional(),
});
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

export const eventQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type EventQuery = z.infer<typeof eventQuerySchema>;
