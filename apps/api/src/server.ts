import { buildApp } from "./app";
import { env } from "./env";
import { checkFfmpegAvailable } from "./modules/videos/transcode/ffmpeg.util";
import { recoverStuckTranscodes } from "./modules/videos/transcode/transcode.queue";

async function main() {
  const app = await buildApp();

  const ffmpegAvailable = await checkFfmpegAvailable();
  if (!ffmpegAvailable) {
    app.log.warn(
      `ffmpeg nao encontrado em "${env.FFMPEG_PATH}". Uploads de video vao falhar ate o ffmpeg ser instalado e configurado (ver .env.example).`
    );
  }

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`VMF API listening on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  try {
    const recovered = await recoverStuckTranscodes();
    if (recovered > 0) {
      app.log.info(`Recovered ${recovered} stuck transcode job(s) from a previous run.`);
    }
  } catch (err) {
    app.log.warn({ err }, "Could not run transcode recovery sweep (database unavailable?)");
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  }
}

main();
