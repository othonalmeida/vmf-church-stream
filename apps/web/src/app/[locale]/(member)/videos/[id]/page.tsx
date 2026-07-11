"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Share2, Heart, Download, Check, Loader2 } from "lucide-react";
import { pickLocalized, type VideoDTO, type CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { VideoPlayer } from "@/components/media/video-player";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { downloadVideoForOffline, removeOfflineDownload, isVideoDownloaded } from "@/lib/offline/download-video";
import { cn } from "@/lib/cn";
import { categoryName } from "@/lib/category-name";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";
import { useAuth } from "@/contexts/auth-context";

export default function VideoDetailPage() {
  const t = useTranslations("videos");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoDTO | null>(null);
  const [category, setCategory] = useState<CategoryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const lastSentRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ video: VideoDTO }>(`/videos/${params.id}`);
        setVideo(data.video);

        apiFetch<{ category: CategoryDTO }>(`/categories/${data.video.categoryId}`)
          .then((cat) => setCategory(cat.category))
          .catch(() => {});

        apiFetch<{ favorites: { contentType: string; contentId: string }[] }>("/favorites")
          .then((data2) => setIsFavorited(data2.favorites.some((f) => f.contentType === "VIDEO" && f.contentId === params.id)))
          .catch(() => {});

        apiFetch<{ progress: { watchedSeconds: number } | null }>(`/history/${params.id}`)
          .then((data3) => {
            if (data3.progress && data3.progress.watchedSeconds > 5) setStartAt(data3.progress.watchedSeconds);
          })
          .catch(() => {});

        if (user) isVideoDownloaded(params.id, user.id).then(setIsDownloaded);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tCommon("error"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      const shareTitle = video ? pickLocalized(video.titlePt, video.titleEn, video.titleEs, locale) : undefined;
      await navigator.share({ title: shareTitle, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await apiFetch(`/favorites/VIDEO/${params.id}`, { method: "DELETE" });
      } else {
        await apiFetch("/favorites", { method: "POST", body: { contentType: "VIDEO", contentId: params.id } });
      }
      setIsFavorited(!isFavorited);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  const handleDownloadToggle = async () => {
    if (!video || !user) return;
    if (isDownloaded) {
      if (!(await confirm(t("removeDownloadConfirm")))) return;
      await removeOfflineDownload(video.id, user.id);
      setIsDownloaded(false);
      return;
    }
    if (!video.hlsPlaylistUrl) return;
    setDownloadProgress(0);
    try {
      await downloadVideoForOffline(
        {
          id: video.id,
          title: pickLocalized(video.titlePt, video.titleEn, video.titleEs, locale),
          thumbnailUrl: video.thumbnailUrl,
          hlsPlaylistUrl: video.hlsPlaylistUrl,
        },
        user.id,
        setDownloadProgress
      );
      setIsDownloaded(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setDownloadProgress(null);
    }
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    const now = Date.now();
    if (now - lastSentRef.current < 10000) return;
    lastSentRef.current = now;
    apiFetch("/history", {
      method: "POST",
      body: { videoId: params.id, watchedSeconds: Math.floor(currentTime), durationSeconds: Math.floor(duration) || undefined },
    }).catch(() => {});
  };

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>;
  }
  if (!video) {
    return <p className="text-ink-600">{t("loading")}</p>;
  }

  const title = pickLocalized(video.titlePt, video.titleEn, video.titleEs, locale);
  const description = pickLocalized(video.descriptionPt, video.descriptionEn, video.descriptionEs, locale);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/videos" className="flex items-center gap-1 text-sm text-ink-600 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      {video.transcodeStatus === "READY" && video.hlsPlaylistUrl ? (
        <VideoPlayer
          src={video.hlsPlaylistUrl}
          poster={video.thumbnailUrl}
          subtitles={video.subtitles}
          onTimeUpdate={handleTimeUpdate}
          startAt={startAt}
        />
      ) : (
        <Card className="flex aspect-video items-center justify-center text-ink-600">
          {video.transcodeStatus === "FAILED" ? t("failedMessage") : t("processingMessage")}
        </Card>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
            {category && <span>{categoryName(category, locale)}</span>}
            {video.publishedAt && <span>· {new Date(video.publishedAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            title={t("share")}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border px-2.5 py-2 text-sm text-ink-700 hover:bg-surface-border sm:px-3"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("share")}</span>
          </button>
          <button
            onClick={toggleFavorite}
            title={isFavorited ? t("favorited") : t("favorite")}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border px-2.5 py-2 text-sm text-ink-700 hover:bg-surface-border sm:px-3"
          >
            <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
            <span className="hidden sm:inline">{isFavorited ? t("favorited") : t("favorite")}</span>
          </button>
          {video.allowDownload && (
            <button
              onClick={handleDownloadToggle}
              disabled={downloadProgress !== null}
              title={t("download")}
              className="flex items-center gap-1.5 rounded-xl border border-surface-border px-2.5 py-2 text-sm text-ink-700 hover:bg-surface-border disabled:opacity-60 sm:px-3"
            >
              {downloadProgress !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">{downloadProgress}%</span>
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="hidden sm:inline">{t("downloaded")}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("download")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {description && (
        <Card>
          <p className="whitespace-pre-line text-sm text-ink-700">{description}</p>
        </Card>
      )}
    </div>
  );
}
