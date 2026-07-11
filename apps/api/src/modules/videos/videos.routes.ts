import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import type { FastifyInstance } from "fastify";
import { videoInputSchema, videoUpdateSchema, paginationQuerySchema, idParamSchema } from "@vmf/shared";
import {
  listVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoOrThrow,
  markVideoUploaded,
  VideoError,
} from "./videos.service.js";
import { storage, resolveScratchPath, ensureScratchDir, removeScratchPath } from "../../lib/storage/index.js";
import { enqueueTranscode } from "./transcode/transcode.queue.js";

const ALLOWED_VIDEO_MIME = /^video\//;

export default async function videoRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof VideoError) {
      reply.code(error.statusCode).send({ error: "VideoError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = request.query as { categoryId?: string; offlineOnly?: string; q?: string };
    const pagination = paginationQuerySchema.parse(request.query);
    const publishedOnly = request.user.role !== "ADMIN";
    const result = await listVideos(
      request.user.churchId,
      { ...query, offlineOnly: query.offlineOnly === "true", publishedOnly },
      pagination
    );
    reply.send(result);
  });

  app.get("/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const publishedOnly = request.user.role !== "ADMIN";
    const video = await getVideoById(id, request.user.churchId, publishedOnly);
    reply.send({ video });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = videoInputSchema.parse(request.body);
      const video = await createVideo(input, request.user.sub, request.user.churchId);
      reply.code(201).send({ video });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = videoUpdateSchema.parse(request.body);
      const video = await updateVideo(id, request.user.churchId, input);
      reply.send({ video });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const video = await getVideoOrThrow(id, request.user.churchId);
      await deleteVideo(id, request.user.churchId);
      await removeScratchPath(path.join("originals", video.id));
      await storage.deletePrefix(path.join("hls", video.id));
      await storage.deletePrefix(path.join("thumbnails", video.id));
      await storage.deletePrefix(path.join("subtitles", video.id));
      reply.code(204).send();
    }
  );

  app.post(
    "/:id/upload",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await getVideoOrThrow(id, request.user.churchId);

      const file = await request.file();
      if (!file) {
        reply.code(400).send({ error: "ValidationError", message: "No file uploaded" });
        return;
      }
      if (!ALLOWED_VIDEO_MIME.test(file.mimetype)) {
        reply.code(400).send({ error: "ValidationError", message: "File must be a video" });
        return;
      }

      const ext = path.extname(file.filename) || ".mp4";
      const relativeDir = path.join("originals", id);
      await ensureScratchDir(relativeDir);
      const relativePath = path.join(relativeDir, `source${ext}`);
      const destPath = resolveScratchPath(relativePath);

      await pipeline(file.file, createWriteStream(destPath));

      if (file.file.truncated) {
        reply.code(413).send({ error: "ValidationError", message: "File exceeds the maximum allowed size" });
        return;
      }

      await markVideoUploaded(id, request.user.churchId, destPath);
      enqueueTranscode(id);

      reply.code(202).send({ message: "Upload received, transcoding started", transcodeStatus: "PENDING" });
    }
  );

  app.post(
    "/:id/reprocess",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const video = await getVideoOrThrow(id, request.user.churchId);
      if (!video.sourceFilePath) {
        reply.code(400).send({ error: "ValidationError", message: "Video has no uploaded source file" });
        return;
      }
      enqueueTranscode(id);
      reply.send({ message: "Reprocessing started", transcodeStatus: "PENDING" });
    }
  );
}
