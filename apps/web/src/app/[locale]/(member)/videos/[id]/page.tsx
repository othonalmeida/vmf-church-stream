"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Share2, Heart, Download, Check, Loader2 } from "lucide-react";
import type { VideoDTO, CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { VideoPlayer } from "@/components/media/video-player";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { downloadVideoForOffline, removeOfflineDownload, isVideoDownloaded } from "@/lib/offline/download-video";
import { cn } from "@/lib/cn";
import { categoryName } from "@/lib/category-name";

export default function VideoDetailPage() {
  const t = useTranslations("videos");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
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

        isVideoDownloaded(params.id).then(setIsDownloaded);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tCommon("error"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: video?.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert(t("linkCopied"));
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
      alert(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  const handleDownloadToggle = async () => {
    if (!video) return;
    if (isDownloaded) {
      if (!confirm(t("removeDownloadConfirm"))) return;
      await removeOfflineDownload(video.id);
      setIsDownloaded(false);
      return;
    }
    if (!video.hlsPlaylistUrl) return;
    setDownloadProgress(0);
    try {
      await downloadVideoForOffline(
        { id: video.id, title: video.title, thumbnailUrl: video.thumbnailUrl, hlsPlaylistUrl: video.hlsPlaylistUrl },
        setDownloadProgress
      );
      setIsDownloaded(true);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : tCommon("error"));
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
    return <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>;
  }
  if (!video) {
    return <p className="text-white/60">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/videos" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
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
        <Card className="flex aspect-video items-center justify-center text-white/60">
          {video.transcodeStatus === "FAILED" ? t("failedMessage") : t("processingMessage")}
        </Card>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{video.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/50">
            {category && <span>{categoryName(category, locale)}</span>}
            <span>· {video.originalLanguage}</span>
            {video.publishedAt && <span>· {new Date(video.publishedAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm text-white/80 hover:bg-surface-border"
          >
            <Share2 className="h-4 w-4" />
            {t("share")}
          </button>
          <button
            onClick={toggleFavorite}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm text-white/80 hover:bg-surface-border"
          >
            <Heart className={cn("h-4 w-4", isFavorited && "fill-red-400 text-red-400")} />
            {isFavorited ? t("favorited") : t("favorite")}
          </button>
          {video.allowDownload && (
            <button
              onClick={handleDownloadToggle}
              disabled={downloadProgress !== null}
              className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm text-white/80 hover:bg-surface-border disabled:opacity-60"
            >
              {downloadProgress !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {downloadProgress}%
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  {t("downloaded")}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {t("download")}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {video.description && (
        <Card>
          <p className="whitespace-pre-line text-sm text-white/80">{video.description}</p>
        </Card>
      )}
    </div>
  );
}
