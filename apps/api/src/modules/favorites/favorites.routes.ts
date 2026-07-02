import type { FastifyInstance } from "fastify";
import { favoriteInputSchema } from "@vmf/shared";
import { listFavorites, addFavorite, removeFavorite, FavoriteError } from "./favorites.service.js";

export default async function favoriteRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof FavoriteError) {
      reply.code(error.statusCode).send({ error: "FavoriteError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const favorites = await listFavorites(request.user.sub);
    reply.send({ favorites });
  });

  app.post("/", { preHandler: app.authenticate }, async (request, reply) => {
    const input = favoriteInputSchema.parse(request.body);
    await addFavorite(request.user.sub, input.contentType, input.contentId);
    reply.code(201).send({ message: "Favorited" });
  });

  app.delete("/:contentType/:contentId", { preHandler: app.authenticate }, async (request, reply) => {
    const { contentType, contentId } = request.params as { contentType: string; contentId: string };
    await removeFavorite(request.user.sub, contentType as never, contentId);
    reply.code(204).send();
  });
}
