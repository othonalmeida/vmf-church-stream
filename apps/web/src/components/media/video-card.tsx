import type { VideoDTO } from "@vmf/shared";
import { Link } from "@/i18n/routing";
import { Play } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: VideoDTO }) {
  const thumb = video.thumbnailUrl
    ? video.thumbnailUrl.startsWith("http")
      ? video.thumbnailUrl
      : `${API_URL}${video.thumbnailUrl}`
    : null;

  return (
    <Link href={`/videos/${video.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-raised">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={video.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <Play className="h-10 w-10" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        {video.transcodeStatus !== "READY" && (
          <span className="absolute left-1.5 top-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[11px] font-medium text-black">
            {video.transcodeStatus === "FAILED" ? "Falhou" : "Processando"}
          </span>
        )}
      </div>
      <div>
        <h3 className="line-clamp-1 text-sm font-medium text-white">{video.title}</h3>
      </div>
    </Link>
  );
}
