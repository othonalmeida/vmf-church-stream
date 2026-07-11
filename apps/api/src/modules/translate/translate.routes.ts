import type { FastifyInstance } from "fastify";
import { translateRequestSchema } from "@vmf/shared";
import { translateFields, TranslateError } from "./translate.service.js";

export default async function translateRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof TranslateError) {
      reply.code(error.statusCode).send({ error: "TranslateError", message: error.message });
      return;
    }
    throw error;
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = translateRequestSchema.parse(request.body);
      const result = await translateFields(input);
      reply.send(result);
    }
  );
}
