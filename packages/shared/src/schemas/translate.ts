import { z } from "zod";

export const translateFieldSchema = z.object({
  text: z.string().max(20000),
  html: z.boolean().optional(),
});

export const translateRequestSchema = z.record(z.string(), translateFieldSchema);
export type TranslateRequest = z.infer<typeof translateRequestSchema>;

export type TranslateResponse = Record<"en-US" | "es-ES", Record<string, string>>;
