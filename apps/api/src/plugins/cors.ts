import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "../env";

export default fp(async function corsPlugin(app: FastifyInstance) {
  await app.register(cors, {
    // Em dev, o Next as vezes sobe numa porta diferente de 3000 se ela ja
    // estiver ocupada (comum nesta maquina) — aceitamos qualquer localhost
    // para nao travar o fluxo de trabalho. Em producao, so a origem exata
    // configurada em WEB_ORIGIN.
    origin:
      env.NODE_ENV === "production"
        ? env.WEB_ORIGIN
        : (origin, callback) => {
            if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
              callback(null, true);
              return;
            }
            callback(new Error("Not allowed by CORS"), false);
          },
    credentials: true,
  });
});
