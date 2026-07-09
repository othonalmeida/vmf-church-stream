import type { FastifyInstance } from "fastify";
import { churchInputSchema, churchUpdateSchema, churchIdParamSchema } from "@vmf/shared";
import { listChurches, createChurch, updateChurch, deleteChurch, ChurchError } from "./churches.service.js";

export default async function churchRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ChurchError) {
      reply.code(error.statusCode).send({ error: "ChurchError", message: error.message });
      return;
    }
    throw error;
  });

  // Publica de proposito: usada pelo seletor de igreja na tela de registro,
  // que roda antes do login (sem token disponivel ainda).
  app.get("/", async (_request, reply) => {
    const churches = await listChurches();
    reply.send({ churches });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = churchInputSchema.parse(request.body);
      const church = await createChurch(input);
      reply.code(201).send({ church });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = churchIdParamSchema.parse(request.params);
      const input = churchUpdateSchema.parse(request.body);
      const church = await updateChurch(id, input);
      reply.send({ church });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = churchIdParamSchema.parse(request.params);
      await deleteChurch(id);
      reply.code(204).send();
    }
  );
}
