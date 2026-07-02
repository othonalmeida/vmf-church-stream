import type { FastifyInstance } from "fastify";
import { eventInputSchema, eventUpdateSchema, eventQuerySchema, idParamSchema } from "@vmf/shared";
import { listEvents, getEventById, createEvent, updateEvent, deleteEvent, EventError } from "./events.service.js";

export default async function eventRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof EventError) {
      reply.code(error.statusCode).send({ error: "EventError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = eventQuerySchema.parse(request.query);
    const publishedOnly = request.user.role !== "ADMIN";
    const events = await listEvents({ ...query, publishedOnly });
    reply.send({ events });
  });

  app.get("/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const publishedOnly = request.user.role !== "ADMIN";
    const event = await getEventById(id, publishedOnly);
    reply.send({ event });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = eventInputSchema.parse(request.body);
      const event = await createEvent(input, request.user.sub);
      reply.code(201).send({ event });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = eventUpdateSchema.parse(request.body);
      const event = await updateEvent(id, input);
      reply.send({ event });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await deleteEvent(id);
      reply.code(204).send();
    }
  );
}
