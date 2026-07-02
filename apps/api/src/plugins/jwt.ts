import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { ACCESS_TOKEN_TTL } from "@vmf/shared";
import { env } from "../env";

export default fp(async function jwtPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: ACCESS_TOKEN_TTL },
  });
});
