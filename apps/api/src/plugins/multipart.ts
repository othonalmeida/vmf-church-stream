import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { MAX_VIDEO_UPLOAD_BYTES } from "@vmf/shared";

export default fp(async function multipartPlugin(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: MAX_VIDEO_UPLOAD_BYTES,
      files: 1,
    },
  });
});
