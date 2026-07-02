import type { FastifyInstance } from "fastify";
import { getDashboardStats } from "./dashboard.service.js";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/stats",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (_request, reply) => {
      const stats = await getDashboardStats();
      reply.send({ stats });
    }
  );
}
