import type { FastifyInstance } from "fastify";
import {
  textContentInputSchema,
  textContentUpdateSchema,
  paginationQuerySchema,
  idParamSchema,
} from "@vmf/shared";
import {
  listTextContents,
  getTextContentById,
  createTextContent,
  updateTextContent,
  deleteTextContent,
  TextContentError,
} from "./text-contents.service.js";

export default async function textContentRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof TextContentError) {
      reply.code(error.statusCode).send({ error: "TextContentError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = request.query as { categoryId?: string; language?: string; q?: string };
    const pagination = paginationQuerySchema.parse(request.query);
    const publishedOnly = request.user.role !== "ADMIN";
    const result = await listTextContents(request.user.churchId, { ...query, publishedOnly }, pagination);
    reply.send(result);
  });

  app.get("/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const publishedOnly = request.user.role !== "ADMIN";
    const content = await getTextContentById(id, request.user.churchId, publishedOnly);
    reply.send({ content });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = textContentInputSchema.parse(request.body);
      const content = await createTextContent(input, request.user.sub, request.user.churchId);
      reply.code(201).send({ content });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = textContentUpdateSchema.parse(request.body);
      const content = await updateTextContent(id, request.user.churchId, input);
      reply.send({ content });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await deleteTextContent(id, request.user.churchId);
      reply.code(204).send();
    }
  );
}
