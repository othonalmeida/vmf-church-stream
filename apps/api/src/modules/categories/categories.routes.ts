import type { FastifyInstance } from "fastify";
import { categoryInputSchema, categoryUpdateSchema, idParamSchema } from "@vmf/shared";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryError,
} from "./categories.service.js";

export default async function categoryRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof CategoryError) {
      reply.code(error.statusCode).send({ error: "CategoryError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = request.query as { contentType?: string };
    const includeInactive = request.user.role === "ADMIN";
    const categories = await listCategories(request.user.churchId, { contentType: query.contentType, includeInactive });
    reply.send({ categories });
  });

  app.get("/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const category = await getCategoryById(id, request.user.churchId);
    reply.send({ category });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = categoryInputSchema.parse(request.body);
      const category = await createCategory(input, request.user.churchId);
      reply.code(201).send({ category });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = categoryUpdateSchema.parse(request.body);
      const category = await updateCategory(id, request.user.churchId, input);
      reply.send({ category });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await deleteCategory(id, request.user.churchId);
      reply.code(204).send();
    }
  );
}
