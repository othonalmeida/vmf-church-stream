import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fp(async function authGuardPlugin(app: FastifyInstance) {
  app.decorate("authenticate", async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing access token" });
    }
  });

  app.decorate("authorize", function authorize(roles: Array<"ADMIN" | "MEMBER">) {
    return async function authorizeHandler(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user || !roles.includes(request.user.role)) {
        reply.code(403).send({ error: "Forbidden", message: "Insufficient permissions" });
      }
    };
  });
});
