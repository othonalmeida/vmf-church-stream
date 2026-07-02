export const SUPPORTED_LOCALES = ["pt-BR", "en-US", "es-ES"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";

export const SUBTITLE_LANGUAGES = ["pt-BR", "en-US", "es-ES"] as const;
export type SubtitleLanguage = (typeof SUBTITLE_LANGUAGES)[number];

export const ROLES = ["ADMIN", "MEMBER"] as const;
export type RoleName = (typeof ROLES)[number];

export const CONTENT_TYPES = [
  "VIDEO",
  "TEXT",
  "TRAINING",
  "EVENT",
] as const;
export type ContentTypeName = (typeof CONTENT_TYPES)[number];

export const PUBLISH_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PublishStatusName = (typeof PUBLISH_STATUSES)[number];

export const TRANSCODE_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;
export type TranscodeStatusName = (typeof TRANSCODE_STATUSES)[number];

export const DOWNLOAD_STATUSES = [
  "REQUESTED",
  "DOWNLOADED",
  "REMOVED",
  "EXPIRED",
] as const;
export type DownloadStatusName = (typeof DOWNLOAD_STATUSES)[number];

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const PASSWORD_RESET_TTL_MINUTES = 60;

export const MAX_VIDEO_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
export const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_SUBTITLE_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
