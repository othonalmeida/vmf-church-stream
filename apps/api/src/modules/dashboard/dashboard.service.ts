import { prisma } from "../../lib/prisma.js";
import type { DashboardStatsDTO } from "@vmf/shared";

export async function getDashboardStats(churchId: number): Promise<DashboardStatsDTO> {
  const now = new Date();

  const [
    totalMembers,
    publishedVideos,
    activeTrainings,
    upcomingEvents,
    totalDownloads,
    progressRecords,
    lessonCount,
    topViews,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER", churchId } }),
    prisma.video.count({ where: { status: "PUBLISHED", churchId } }),
    prisma.training.count({ where: { status: "PUBLISHED", churchId } }),
    prisma.event.count({ where: { status: "PUBLISHED", startDate: { gte: now }, churchId } }),
    prisma.offlineDownload.count({ where: { status: "DOWNLOADED", video: { churchId } } }),
    prisma.trainingProgress.count({ where: { completed: true, lesson: { module: { training: { churchId } } } } }),
    prisma.trainingLesson.count({ where: { module: { training: { churchId } } } }),
    prisma.viewHistory.groupBy({
      by: ["videoId"],
      where: { video: { churchId } },
      _count: { videoId: true },
      orderBy: { _count: { videoId: "desc" } },
      take: 5,
    }),
    prisma.viewHistory.groupBy({
      by: ["userId"],
      where: { user: { churchId } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    }),
  ]);

  const videoIds = topViews.map((v) => v.videoId);
  const videos = videoIds.length ? await prisma.video.findMany({ where: { id: { in: videoIds } } }) : [];
  const mostWatchedVideos = topViews.map((v) => ({
    videoId: v.videoId,
    title: videos.find((video) => video.id === v.videoId)?.title ?? "—",
    views: v._count.videoId,
  }));

  const userIds = activeUsers.map((u) => u.userId);
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const mostActiveUsers = activeUsers.map((u) => ({
    userId: u.userId,
    name: users.find((user) => user.id === u.userId)?.name ?? "—",
    viewCount: u._count.userId,
  }));

  const averageTrainingProgress = lessonCount > 0 ? Math.round((progressRecords / lessonCount) * 100) : 0;

  return {
    totalMembers,
    publishedVideos,
    activeTrainings,
    upcomingEvents,
    totalDownloads,
    averageTrainingProgress,
    mostWatchedVideos,
    mostActiveUsers,
  };
}
