"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, Circle, PlayCircle, FileText } from "lucide-react";
import { pickLocalized, type TrainingDTO, type TrainingLessonDTO, type VideoDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { VideoPlayer } from "@/components/media/video-player";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/contexts/toast-context";

export default function TrainingDetailPage() {
  const t = useTranslations("trainings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const [training, setTraining] = useState<TrainingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [activeLesson, setActiveLesson] = useState<TrainingLessonDTO | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoDTO | null>(null);

  const allLessons = useMemo(
    () => training?.modules.flatMap((m) => m.lessons) ?? [],
    [training]
  );

  const load = async () => {
    try {
      const data = await apiFetch<{ training: TrainingDTO }>(`/trainings/${params.id}`);
      setTraining(data.training);
      if (!activeLesson) {
        const firstIncomplete = data.training.modules.flatMap((m) => m.lessons).find((l) => !l.completed);
        setActiveLesson(firstIncomplete ?? data.training.modules[0]?.lessons[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (activeLesson?.contentType === "VIDEO" && activeLesson.videoId) {
      apiFetch<{ video: VideoDTO }>(`/videos/${activeLesson.videoId}`)
        .then((data) => setActiveVideo(data.video))
        .catch(() => setActiveVideo(null));
    } else {
      setActiveVideo(null);
    }
  }, [activeLesson]);

  const toggleComplete = async (lesson: TrainingLessonDTO) => {
    try {
      await apiFetch(`/trainings/lessons/${lesson.id}/progress`, {
        method: "POST",
        body: { completed: !lesson.completed },
      });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>;
  if (!training) return <p className="text-ink-600">{tCommon("loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/trainings" className="flex items-center gap-1 text-sm text-ink-600 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      <h1 className="text-2xl font-semibold text-ink-950">
        {pickLocalized(training.titlePt, training.titleEn, training.titleEs, locale)}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeLesson?.contentType === "VIDEO" && activeVideo ? (
            activeVideo.transcodeStatus === "READY" && activeVideo.hlsPlaylistUrl ? (
              <VideoPlayer
                src={activeVideo.hlsPlaylistUrl}
                poster={activeVideo.thumbnailUrl}
                subtitles={activeVideo.subtitles}
                onEnded={() => activeLesson && !activeLesson.completed && toggleComplete(activeLesson)}
              />
            ) : (
              <Card className="flex aspect-video items-center justify-center text-ink-600">
                {t("videoProcessing")}
              </Card>
            )
          ) : activeLesson?.contentType === "TEXT" && activeLesson.textContentId ? (
            <Card>
              <Link href={`/texts/${activeLesson.textContentId}`} className="text-gold-700 hover:underline">
                {t("openReading")}: {activeLesson.title}
              </Link>
            </Card>
          ) : (
            <Card className="text-ink-600">{t("selectLesson")}</Card>
          )}

          {activeLesson && (
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-ink-950">{activeLesson.title}</h2>
                {activeLesson.description && <p className="text-sm text-ink-600">{activeLesson.description}</p>}
              </div>
              <button
                onClick={() => toggleComplete(activeLesson)}
                className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm text-ink-700 hover:bg-surface-border"
              >
                {activeLesson.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4" />}
                {activeLesson.completed ? t("completed") : t("markComplete")}
              </button>
            </div>
          )}
        </div>

        <Card className="flex flex-col gap-4 p-4">
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
              <div className="h-full bg-brand-500" style={{ width: `${training.progressPercent ?? 0}%` }} />
            </div>
            <span className="mt-1 block text-xs text-ink-500">
              {training.progressPercent ?? 0}% {t("percentComplete")}
            </span>
          </div>

          {training.modules.map((module) => (
            <div key={module.id}>
              <h3 className="mb-2 text-sm font-semibold text-ink-700">{module.title}</h3>
              <ul className="flex flex-col gap-1">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      onClick={() => setActiveLesson(lesson)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-600 hover:bg-surface-border",
                        activeLesson?.id === lesson.id && "bg-surface-border text-ink-950"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : lesson.contentType === "VIDEO" ? (
                        <PlayCircle className="h-4 w-4 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {allLessons.length === 0 && <p className="text-sm text-ink-500">{t("noLessons")}</p>}
        </Card>
      </div>
    </div>
  );
}
