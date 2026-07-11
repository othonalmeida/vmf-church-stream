import { z } from "zod";
import { publishStatusSchema } from "./video";

export const trainingInputSchema = z.object({
  titlePt: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  titleEs: z.string().trim().min(1).max(200),
  descriptionPt: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionEs: z.string().trim().max(2000).optional().or(z.literal("")),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: publishStatusSchema.default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
});
export type TrainingInput = z.infer<typeof trainingInputSchema>;
export const trainingUpdateSchema = trainingInputSchema.partial();
export type TrainingUpdateInput = z.infer<typeof trainingUpdateSchema>;

export const trainingModuleInputSchema = z.object({
  trainingId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});
export type TrainingModuleInput = z.infer<typeof trainingModuleInputSchema>;
export const trainingModuleUpdateSchema = trainingModuleInputSchema.partial();
export type TrainingModuleUpdateInput = z.infer<typeof trainingModuleUpdateSchema>;

export const lessonContentTypeSchema = z.enum(["VIDEO", "TEXT"]);

export const trainingLessonInputSchema = z
  .object({
    moduleId: z.string().uuid(),
    contentType: lessonContentTypeSchema,
    videoId: z.string().uuid().optional(),
    textContentId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    order: z.coerce.number().int().min(0).default(0),
    required: z.coerce.boolean().default(true),
  })
  .refine((d) => (d.contentType === "VIDEO" ? !!d.videoId : !!d.textContentId), {
    message: "videoId or textContentId must match contentType",
    path: ["videoId"],
  });
export type TrainingLessonInput = z.infer<typeof trainingLessonInputSchema>;

export const lessonProgressInputSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.coerce.boolean(),
});
export type LessonProgressInput = z.infer<typeof lessonProgressInputSchema>;
