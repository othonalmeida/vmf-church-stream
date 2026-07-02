import type { FastifyInstance } from "fastify";
import { globalSearch, type SearchResultItem } from "./search.service.js";

export default async function searchRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = request.query as {
      q?: string;
      categoryId?: string;
      language?: string;
      types?: string;
      offlineOnly?: string;
    };

    const types = query.types
      ? (query.types.split(",") as SearchResultItem["type"][])
      : undefined;

    const results = await globalSearch({
      q: query.q,
      categoryId: query.categoryId,
      language: query.language as never,
      types,
      offlineOnly: query.offlineOnly === "true",
    });

    reply.send({ results });
  });
}
