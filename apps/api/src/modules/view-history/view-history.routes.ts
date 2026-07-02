import type { FastifyInstance } from "fastify";
import { viewHistoryUpsertSchema } from "@vmf/shared";
import {
  upsertViewHistory,
  listContinueWatching,
  getVideoProgress,
  ViewHistoryError,
} from "./view-history.service.js";

export default async function viewHistoryRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ViewHistoryError) {
      reply.code(error.statusCode).send({ error: "ViewHistoryError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const items = await listContinueWatching(request.user.sub);
    reply.send({ items });
  });

  app.get("/:videoId", { preHandler: app.authenticate }, async (request, reply) => {
    const { videoId } = request.params as { videoId: string };
    const progress = await getVideoProgress(request.user.sub, videoId);
    reply.send({ progress });
  });

  app.post("/", { preHandler: app.authenticate }, async (request, reply) => {
    const input = viewHistoryUpsertSchema.parse(request.body);
    await upsertViewHistory(request.user.sub, input.videoId, input.watchedSeconds, input.durationSeconds);
    reply.code(204).send();
  });
}
