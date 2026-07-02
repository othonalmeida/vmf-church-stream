import type { FastifyInstance } from "fastify";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@vmf/shared";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  getUserById,
  updateProfile,
  AuthError,
} from "./auth.service";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "./cookie.util";

export default async function authRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      reply.code(error.statusCode).send({ error: "AuthError", message: error.message });
      return;
    }
    throw error;
  });

  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const { user, refreshToken } = await registerUser(input);
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    setRefreshCookie(reply, refreshToken);
    reply.code(201).send({ user, accessToken, expiresIn: 15 * 60 });
  });

  app.post("/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const { user, refreshToken } = await loginUser(input);
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    setRefreshCookie(reply, refreshToken);
    reply.send({ user, accessToken, expiresIn: 15 * 60 });
  });

  app.post("/refresh", async (request, reply) => {
    const oldToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!oldToken) {
      reply.code(401).send({ error: "AuthError", message: "Missing refresh token" });
      return;
    }
    const { user, refreshToken } = await refreshSession(oldToken);
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    setRefreshCookie(reply, refreshToken);
    reply.send({ user, accessToken, expiresIn: 15 * 60 });
  });

  app.post("/logout", async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];
    await logoutUser(token);
    clearRefreshCookie(reply);
    reply.code(204).send();
  });

  app.post("/forgot-password", async (request, reply) => {
    const input = forgotPasswordSchema.parse(request.body);
    const token = await requestPasswordReset(input.email);
    if (token) {
      // MVP sem SMTP configurado: o token e logado no console da API.
      // Trocar por envio real de e-mail (Resend/SMTP) em producao.
      request.log.info({ resetToken: token }, `Password reset requested for ${input.email}`);
    }
    reply.send({ message: "If the e-mail exists, a reset link was sent." });
  });

  app.post("/reset-password", async (request, reply) => {
    const input = resetPasswordSchema.parse(request.body);
    await resetPassword(input.token, input.password);
    reply.send({ message: "Password updated successfully." });
  });

  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const user = await getUserById(request.user.sub);
    reply.send({ user });
  });

  app.patch("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const input = updateProfileSchema.parse(request.body);
    const user = await updateProfile(request.user.sub, input);
    reply.send({ user });
  });
}
