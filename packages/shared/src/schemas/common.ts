import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SUPPORTED_LOCALES } from "../constants/index";

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
