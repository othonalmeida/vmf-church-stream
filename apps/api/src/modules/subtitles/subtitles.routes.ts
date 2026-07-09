import path from "node:path";
import { promises as fs } from "node:fs";
import type { FastifyInstance } from "fastify";
import { subtitleLanguageSchema, MAX_SUBTITLE_UPLOAD_BYTES } from "@vmf/shared";
import { upsertSubtitle, deleteSubtitle, SubtitleError } from "./subtitles.service.js";
import { storage, isS3Storage, resolveScratchPath, ensureScratchDir, removeScratchPath } from "../../lib/storage/index.js";
import { srtToVtt, isLikelyVtt } from "../../lib/subtitle-convert.js";

export default async function subtitleRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof SubtitleError) {
      reply.code(error.statusCode).send({ error: "SubtitleError", message: error.message });
      return;
    }
    throw error;
  });

  app.post(
    "/:videoId/subtitles",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { videoId } = request.params as { videoId: string };
      const file = await request.file();
      if (!file) {
        reply.code(400).send({ error: "ValidationError", message: "No subtitle file uploaded" });
        return;
      }

      const language = subtitleLanguageSchema.safeParse((file.fields.language as { value?: string })?.value);
      if (!language.success) {
        reply.code(400).send({ error: "ValidationError", message: "Missing or invalid 'language' field" });
        return;
      }

      const ext = path.extname(file.filename).toLowerCase();
      if (![".vtt", ".srt"].includes(ext)) {
        reply.code(400).send({ error: "ValidationError", message: "Subtitle must be a .vtt or .srt file" });
        return;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) {
        chunks.push(chunk as Buffer);
      }
      const raw = Buffer.concat(chunks);
      if (raw.byteLength > MAX_SUBTITLE_UPLOAD_BYTES || file.file.truncated) {
        reply.code(413).send({ error: "ValidationError", message: "Subtitle file exceeds the maximum allowed size" });
        return;
      }

      const text = raw.toString("utf-8");
      const vttContent = ext === ".srt" ? srtToVtt(text) : isLikelyVtt(text) ? text : `WEBVTT\n\n${text}`;

      const relativeDir = path.join("subtitles", videoId);
      await ensureScratchDir(relativeDir);
      const relativePath = path.join(relativeDir, `${language.data}.vtt`);
      await fs.writeFile(resolveScratchPath(relativePath), vttContent, "utf-8");

      const publicUrl = await storage.putFile(relativePath, resolveScratchPath(relativePath));
      if (isS3Storage) await removeScratchPath(relativeDir);

      const subtitle = await upsertSubtitle(videoId, request.user.churchId, language.data, publicUrl);
      reply.code(201).send({ subtitle });
    }
  );

  app.delete(
    "/:videoId/subtitles/:subtitleId",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { videoId, subtitleId } = request.params as { videoId: string; subtitleId: string };
      await deleteSubtitle(videoId, request.user.churchId, subtitleId);
      reply.code(204).send();
    }
  );
}
