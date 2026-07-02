import type { FastifyInstance } from "fastify";
import { offlineDownloadRequestSchema } from "@vmf/shared";
import { requestDownload, listDownloads, removeDownload, OfflineDownloadError } from "./offline-downloads.service.js";

export default async function offlineDownloadRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof OfflineDownloadError) {
      reply.code(error.statusCode).send({ error: "OfflineDownloadError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const downloads = await listDownloads(request.user.sub);
    reply.send({ downloads });
  });

  app.post("/", { preHandler: app.authenticate }, async (request, reply) => {
    const input = offlineDownloadRequestSchema.parse(request.body);
    const result = await requestDownload(request.user.sub, input.videoId, input.deviceId);
    reply.code(201).send(result);
  });

  app.delete("/:videoId", { preHandler: app.authenticate }, async (request, reply) => {
    const { videoId } = request.params as { videoId: string };
    const { deviceId } = request.query as { deviceId: string };
    if (!deviceId) {
      reply.code(400).send({ error: "ValidationError", message: "deviceId query param is required" });
      return;
    }
    await removeDownload(request.user.sub, videoId, deviceId);
    reply.code(204).send();
  });
}
