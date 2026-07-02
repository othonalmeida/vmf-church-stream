import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
    WEB_ORIGIN: z.string().min(1).default("http://localhost:3000"),
    COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 chars"),
    UPLOADS_DIR: z.string().default("uploads"),
    FFMPEG_PATH: z.string().default("ffmpeg"),
    FFPROBE_PATH: z.string().default("ffprobe"),
    TRANSCODE_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(1),
    TRANSCODE_TIMEOUT_MINUTES: z.coerce.number().int().min(1).default(60),

    // STORAGE_DRIVER=local serves apps/api/uploads directly via /media (default, MVP/dev).
    // STORAGE_DRIVER=s3 uploads final media (HLS, thumbnails, subtitles) to an S3-compatible
    // bucket (Supabase Storage, Backblaze B2, Cloudflare R2, AWS S3...); the local uploads dir
    // is still used as scratch space for ffmpeg, then cleaned up after each upload.
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().default("auto"),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    // Public base URL clients use to fetch objects, e.g.
    // "https://<project>.supabase.co/storage/v1/object/public/<bucket>".
    S3_PUBLIC_URL_BASE: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.STORAGE_DRIVER !== "s3") return;
    for (const key of ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL_BASE"] as const) {
      if (!data[key]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when STORAGE_DRIVER=s3` });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check apps/api/.env against .env.example.");
}

export const env = parsed.data;
