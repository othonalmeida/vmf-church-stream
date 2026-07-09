import type { FastifyInstance } from "fastify";
import { bannerInputSchema, bannerUpdateSchema, idParamSchema } from "@vmf/shared";
import { listBanners, createBanner, updateBanner, deleteBanner, BannerError } from "./banners.service.js";

export default async function bannerRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof BannerError) {
      reply.code(error.statusCode).send({ error: "BannerError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const activeOnly = request.user.role !== "ADMIN";
    const banners = await listBanners(request.user.churchId, activeOnly);
    reply.send({ banners });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = bannerInputSchema.parse(request.body);
      const banner = await createBanner(input, request.user.churchId);
      reply.code(201).send({ banner });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = bannerUpdateSchema.parse(request.body);
      const banner = await updateBanner(id, request.user.churchId, input);
      reply.send({ banner });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await deleteBanner(id, request.user.churchId);
      reply.code(204).send();
    }
  );
}
