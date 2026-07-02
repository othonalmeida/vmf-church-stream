import { z } from "zod";

export const bannerInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type BannerInput = z.infer<typeof bannerInputSchema>;

export const bannerUpdateSchema = bannerInputSchema.partial();
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;

export interface BannerDTO {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
}
