import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import type { FastifyInstance } from "fastify";
import { MAX_IMAGE_UPLOAD_BYTES } from "@vmf/shared";
import { storage, isS3Storage, resolveScratchPath, ensureScratchDir, removeScratchPath } from "../../lib/storage/index.js";
import { guessContentType } from "../../lib/storage/content-type.js";

const ALLOWED_IMAGE_MIME = /^image\/(jpeg|png|webp|gif)$/;

export default async function mediaRoutes(app: FastifyInstance) {
  app.post(
    "/images",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const file = await request.file({ limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } });
      if (!file) {
        reply.code(400).send({ error: "ValidationError", message: "No file uploaded" });
        return;
      }
      if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
        reply.code(400).send({ error: "ValidationError", message: "File must be an image (jpeg, png, webp or gif)" });
        return;
      }

      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        reply.code(413).send({ error: "ValidationError", message: "Image exceeds the maximum allowed size (15MB)" });
        return;
      }

      const ext = path.extname(file.filename) || ".jpg";
      const relativePath = path.join("images", `${randomUUID()}${ext}`);
      await ensureScratchDir("images");
      const scratchPath = resolveScratchPath(relativePath);
      await fs.writeFile(scratchPath, buffer);

      const url = await storage.putFile(relativePath, scratchPath, guessContentType(relativePath));
      if (isS3Storage) await removeScratchPath(relativePath);

      reply.code(201).send({ url });
    }
  );
}
