import { z } from "zod";

export const favoritableTypeSchema = z.enum(["VIDEO", "TEXT", "TRAINING", "EVENT"]);
export type FavoritableTypeName = z.infer<typeof favoritableTypeSchema>;

export const favoriteInputSchema = z.object({
  contentType: favoritableTypeSchema,
  contentId: z.string().uuid(),
});
export type FavoriteInput = z.infer<typeof favoriteInputSchema>;

export const offlineDownloadRequestSchema = z.object({
  videoId: z.string().uuid(),
  deviceId: z.string().trim().min(1).max(200),
});
export type OfflineDownloadRequestInput = z.infer<typeof offlineDownloadRequestSchema>;
