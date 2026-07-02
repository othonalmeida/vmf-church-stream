import fp from "fastify-plugin";
import staticPlugin from "@fastify/static";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { env } from "../env";

export default fp(async function staticFilesPlugin(app: FastifyInstance) {
  const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);

  await app.register(staticPlugin, {
    root: uploadsRoot,
    prefix: "/media/",
    decorateReply: true,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", env.WEB_ORIGIN);
    },
  });
});
