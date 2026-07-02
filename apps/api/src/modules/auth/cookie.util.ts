import type { FastifyReply } from "fastify";
import { env } from "../../env";

export const REFRESH_COOKIE_NAME = "vmf_refresh";

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 30 * 24 * 60 * 60,
    signed: false,
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
}
