import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  TrainingInput,
  TrainingUpdateInput,
  TrainingModuleInput,
  TrainingModuleUpdateInput,
  TrainingLessonInput,
  TrainingDTO,
  TrainingModuleDTO,
  TrainingLessonDTO,
} from "@vmf/shared";

export class TrainingError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TrainingError";
  }
}

type TrainingWithTree = Prisma.TrainingGetPayload<{
  include: { modules: { include: { lessons: true }; orderBy: { order: "asc" } } };
}>;

function toLessonDTO(lesson: {
  id: string;
  moduleId: string;
  contentType: string;
  videoId: string | null;
  textContentId: string | null;
  title: string;
  description: string | null;
  order: number;
  required: boolean;
}, completedLessonIds?: Set<string>): TrainingLessonDTO {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    contentType: lesson.contentType as TrainingLessonDTO["contentType"],
    videoId: lesson.videoId,
    textContentId: lesson.textContentId,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    required: lesson.required,
    ...(completedLessonIds ? { completed: completedLessonIds.has(lesson.id) } : {}),
  };
}

function toModuleDTO(
  module: { id: string; trainingId: string; title: string; description: string | null; order: number; lessons: Parameters<typeof toLessonDTO>[0][] },
  completedLessonIds?: Set<string>
): TrainingModuleDTO {
  return {
    id: module.id,
    trainingId: module.trainingId,
    title: module.title,
    description: module.description,
    order: module.order,
    lessons: [...module.lessons]
      .sort((a, b) => a.order - b.order)
      .map((lesson) => toLessonDTO(lesson, completedLessonIds)),
  };
}

async function toDTO(training: TrainingWithTree, userId?: string): Promise<TrainingDTO> {
  let completedLessonIds: Set<string> | undefined;
  let progressPercent: number | undefined;

  if (userId) {
    const lessonIds = training.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const progress = lessonIds.length
      ? await prisma.trainingProgress.findMany({
          where: { userId, lessonId: { in: lessonIds }, completed: true },
        })
      : [];
    completedLessonIds = new Set(progress.map((p) => p.lessonId));
    progressPercent = lessonIds.length ? Math.round((completedLessonIds.size / lessonIds.length) * 100) : 0;
  }

  return {
    id: training.id,
    title: training.title,
    description: training.description,
    categoryId: training.categoryId,
    imageUrl: training.imageUrl,
    status: training.status as TrainingDTO["status"],
    featured: training.featured,
    order: training.order,
    modules: [...training.modules].sort((a, b) => a.order - b.order).map((m) => toModuleDTO(m, completedLessonIds)),
    ...(progressPercent !== undefined ? { progressPercent } : {}),
  };
}

const includeTree = {
  modules: { include: { lessons: true }, orderBy: { order: "asc" as const } },
};

export async function listTrainings(filters: { categoryId?: string; publishedOnly: boolean }, userId?: string) {
  const trainings = await prisma.training.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.publishedOnly ? { status: "PUBLISHED" } : {}),
    },
    include: includeTree,
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  return Promise.all(trainings.map((t) => toDTO(t, userId)));
}

export async function getTrainingById(id: string, publishedOnly: boolean, userId?: string) {
  const training = await prisma.training.findUnique({ where: { id }, include: includeTree });
  if (!training || (publishedOnly && training.status !== "PUBLISHED")) {
    throw new TrainingError("Training not found", 404);
  }
  return toDTO(training, userId);
}

export async function createTraining(input: TrainingInput, createdById: string) {
  const training = await prisma.training.create({
    data: {
      title: input.title,
      description: input.description || null,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl || null,
      status: input.status,
      featured: input.featured,
      order: input.order,
      createdById,
    },
    include: includeTree,
  });
  return toDTO(training);
}

export async function updateTraining(id: string, input: TrainingUpdateInput) {
  try {
    const training = await prisma.training.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
      include: includeTree,
    });
    return toDTO(training);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TrainingError("Training not found", 404);
    }
    throw error;
  }
}

export async function deleteTraining(id: string) {
  try {
    await prisma.training.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TrainingError("Training not found", 404);
    }
    throw error;
  }
}

export async function createModule(input: TrainingModuleInput) {
  const module = await prisma.trainingModule.create({
    data: {
      trainingId: input.trainingId,
      title: input.title,
      description: input.description || null,
      order: input.order,
    },
  });
  return module;
}

export async function updateModule(id: string, input: TrainingModuleUpdateInput) {
  try {
    return await prisma.trainingModule.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TrainingError("Module not found", 404);
    }
    throw error;
  }
}

export async function deleteModule(id: string) {
  try {
    await prisma.trainingModule.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TrainingError("Module not found", 404);
    }
    throw error;
  }
}

export async function createLesson(input: TrainingLessonInput) {
  const lesson = await prisma.trainingLesson.create({
    data: {
      moduleId: input.moduleId,
      contentType: input.contentType,
      videoId: input.videoId || null,
      textContentId: input.textContentId || null,
      title: input.title,
      description: input.description || null,
      order: input.order,
      required: input.required,
    },
  });
  return lesson;
}

export async function deleteLesson(id: string) {
  try {
    await prisma.trainingLesson.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new TrainingError("Lesson not found", 404);
    }
    throw error;
  }
}

export async function setLessonProgress(userId: string, lessonId: string, completed: boolean) {
  const lesson = await prisma.trainingLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new TrainingError("Lesson not found", 404);

  await prisma.trainingProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { userId, lessonId, completed, completedAt: completed ? new Date() : null },
  });
}
