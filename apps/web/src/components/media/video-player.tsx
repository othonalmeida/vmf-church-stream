"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { SubtitleDTO } from "@vmf/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SUBTITLE_LABELS: Record<string, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "es-ES": "Español",
};

export function VideoPlayer({
  src,
  poster,
  subtitles = [],
  onTimeUpdate,
  onEnded,
  startAt,
}: {
  src: string;
  poster?: string | null;
  subtitles?: SubtitleDTO[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  startAt?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const fullSrc = src.startsWith("http") ? src : `${API_URL}${src}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(fullSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Não foi possível carregar o vídeo.");
        }
      });
      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = fullSrc;
      return;
    }

    setError("Seu navegador não suporta reprodução de HLS.");
  }, [fullSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !startAt) return;
    const handler = () => {
      video.currentTime = startAt;
    };
    video.addEventListener("loadedmetadata", handler, { once: true });
    return () => video.removeEventListener("loadedmetadata", handler);
  }, [startAt]);

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      {error ? (
        <div className="flex aspect-video items-center justify-center text-sm text-white/60">{error}</div>
      ) : (
        <video
          ref={videoRef}
          controls
          poster={poster ?? undefined}
          className="aspect-video w-full bg-black"
          onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime, e.currentTarget.duration)}
          onEnded={onEnded}
          crossOrigin="anonymous"
        >
          {subtitles
            .filter((s) => s.status === "ACTIVE")
            .map((subtitle) => (
              <track
                key={subtitle.id}
                kind="subtitles"
                src={subtitle.fileUrl.startsWith("http") ? subtitle.fileUrl : `${API_URL}${subtitle.fileUrl}`}
                srcLang={subtitle.language}
                label={SUBTITLE_LABELS[subtitle.language] ?? subtitle.language}
              />
            ))}
        </video>
      )}
    </div>
  );
}
