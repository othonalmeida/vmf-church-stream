import type { FastifyInstance } from "fastify";
import { userQuerySchema, adminUserUpdateSchema, paginationQuerySchema, idParamSchema } from "@vmf/shared";
import { listUsers, updateUser, UserError } from "./users.service.js";

export default async function userRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof UserError) {
      reply.code(error.statusCode).send({ error: "UserError", message: error.message });
      return;
    }
    throw error;
  });

  app.get(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const filters = userQuerySchema.parse(request.query);
      const pagination = paginationQuerySchema.parse(request.query);
      const result = await listUsers(request.user.churchId, filters, pagination);
      reply.send(result);
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = adminUserUpdateSchema.parse(request.body);
      const user = await updateUser(id, request.user.churchId, input);
      reply.send({ user });
    }
  );
}
