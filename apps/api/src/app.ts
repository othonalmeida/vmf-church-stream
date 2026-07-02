import Fastify, { type FastifyError } from "fastify";
import { ZodError } from "zod";
import corsPlugin from "./plugins/cors";
import securityPlugin from "./plugins/security";
import cookiePlugin from "./plugins/cookie";
import jwtPlugin from "./plugins/jwt";
import multipartPlugin from "./plugins/multipart";
import staticPlugin from "./plugins/static";
import authGuardPlugin from "./plugins/auth-guard";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import textContentRoutes from "./modules/text-contents/text-contents.routes";
import videoRoutes from "./modules/videos/videos.routes";
import subtitleRoutes from "./modules/subtitles/subtitles.routes";
import trainingRoutes from "./modules/trainings/trainings.routes";
import eventRoutes from "./modules/events/events.routes";
import searchRoutes from "./modules/search/search.routes";
import favoriteRoutes from "./modules/favorites/favorites.routes";
import viewHistoryRoutes from "./modules/view-history/view-history.routes";
import offlineDownloadRoutes from "./modules/offline-downloads/offline-downloads.routes";
import bannerRoutes from "./modules/banners/banners.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

export async function buildApp() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
        : true,
  });

  await app.register(securityPlugin);
  await app.register(corsPlugin);
  await app.register(cookiePlugin);
  await app.register(jwtPlugin);
  await app.register(multipartPlugin);
  await app.register(staticPlugin);
  await app.register(authGuardPlugin);

  app.setErrorHandler((error: FastifyError | ZodError, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        error: "ValidationError",
        message: "Invalid request payload",
        issues: error.flatten(),
      });
      return;
    }
    if (error.validation) {
      reply.code(400).send({ error: "ValidationError", message: error.message });
      return;
    }
    request.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.code(statusCode).send({
      error: statusCode === 500 ? "InternalServerError" : error.name,
      message: statusCode === 500 ? "Something went wrong" : error.message,
    });
  });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(categoryRoutes, { prefix: "/categories" });
  await app.register(textContentRoutes, { prefix: "/text-contents" });
  await app.register(videoRoutes, { prefix: "/videos" });
  await app.register(subtitleRoutes, { prefix: "/videos" });
  await app.register(trainingRoutes, { prefix: "/trainings" });
  await app.register(eventRoutes, { prefix: "/events" });
  await app.register(searchRoutes, { prefix: "/search" });
  await app.register(favoriteRoutes, { prefix: "/favorites" });
  await app.register(viewHistoryRoutes, { prefix: "/history" });
  await app.register(offlineDownloadRoutes, { prefix: "/downloads" });
  await app.register(bannerRoutes, { prefix: "/banners" });
  await app.register(dashboardRoutes, { prefix: "/dashboard" });

  return app;
}
