import type { FastifyInstance } from "fastify";
import {
  trainingInputSchema,
  trainingUpdateSchema,
  trainingModuleInputSchema,
  trainingModuleUpdateSchema,
  trainingLessonInputSchema,
  lessonProgressInputSchema,
  idParamSchema,
} from "@vmf/shared";
import {
  listTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  deleteLesson,
  setLessonProgress,
  TrainingError,
} from "./trainings.service.js";

export default async function trainingRoutes(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof TrainingError) {
      reply.code(error.statusCode).send({ error: "TrainingError", message: error.message });
      return;
    }
    throw error;
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const query = request.query as { categoryId?: string };
    const publishedOnly = request.user.role !== "ADMIN";
    const trainings = await listTrainings(request.user.churchId, { categoryId: query.categoryId, publishedOnly }, request.user.sub);
    reply.send({ trainings });
  });

  app.get("/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const publishedOnly = request.user.role !== "ADMIN";
    const training = await getTrainingById(id, request.user.churchId, publishedOnly, request.user.sub);
    reply.send({ training });
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const input = trainingInputSchema.parse(request.body);
      const training = await createTraining(input, request.user.sub, request.user.churchId);
      reply.code(201).send({ training });
    }
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = trainingUpdateSchema.parse(request.body);
      const training = await updateTraining(id, request.user.churchId, input);
      reply.send({ training });
    }
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      await deleteTraining(id, request.user.churchId);
      reply.code(204).send();
    }
  );

  app.post(
    "/:id/modules",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const input = trainingModuleInputSchema.parse({ ...(request.body as object), trainingId: id });
      const module = await createModule(input, request.user.churchId);
      reply.code(201).send({ module });
    }
  );

  app.patch(
    "/modules/:moduleId",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { moduleId } = request.params as { moduleId: string };
      const input = trainingModuleUpdateSchema.parse(request.body);
      const module = await updateModule(moduleId, request.user.churchId, input);
      reply.send({ module });
    }
  );

  app.delete(
    "/modules/:moduleId",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { moduleId } = request.params as { moduleId: string };
      await deleteModule(moduleId, request.user.churchId);
      reply.code(204).send();
    }
  );

  app.post(
    "/modules/:moduleId/lessons",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { moduleId } = request.params as { moduleId: string };
      const input = trainingLessonInputSchema.parse({ ...(request.body as object), moduleId });
      const lesson = await createLesson(input, request.user.churchId);
      reply.code(201).send({ lesson });
    }
  );

  app.delete(
    "/lessons/:lessonId",
    { preHandler: [app.authenticate, app.authorize(["ADMIN"])] },
    async (request, reply) => {
      const { lessonId } = request.params as { lessonId: string };
      await deleteLesson(lessonId, request.user.churchId);
      reply.code(204).send();
    }
  );

  app.post("/lessons/:lessonId/progress", { preHandler: app.authenticate }, async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };
    const input = lessonProgressInputSchema.parse({ ...(request.body as object), lessonId });
    await setLessonProgress(request.user.sub, lessonId, request.user.churchId, input.completed);
    reply.code(204).send();
  });
}
