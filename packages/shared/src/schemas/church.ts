import { z } from "zod";

export const churchInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export type ChurchInput = z.infer<typeof churchInputSchema>;

export const churchUpdateSchema = churchInputSchema.partial();
export type ChurchUpdateInput = z.infer<typeof churchUpdateSchema>;

export const churchIdParamSchema = z.object({
  id: z.coerce.number().int(),
});

export interface ChurchDTO {
  id: number;
  name: string;
}
