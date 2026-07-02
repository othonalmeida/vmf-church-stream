import "fastify";
import "@fastify/jwt";

export interface AccessTokenPayload {
  sub: string;
  role: "ADMIN" | "MEMBER";
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: Array<"ADMIN" | "MEMBER">) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
