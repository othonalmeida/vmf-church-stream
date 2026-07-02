"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BannerDTO, VideoDTO, TrainingDTO, EventDTO } from "@vmf/shared";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";
import { BannerCarousel } from "@/components/media/banner-carousel";
import { VideoCard } from "@/components/media/video-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ContinueWatchingItem {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  percentualWatched: number;
}

export default function BrowsePage() {
  const t = useTranslations("home");
  const { user } = useAuth();
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoDTO[]>([]);
  const [trainings, setTrainings] = useState<TrainingDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);

  useEffect(() => {
    apiFetch<{ banners: BannerDTO[] }>("/banners").then((d) => setBanners(d.banners)).catch(() => {});
    apiFetch<{ items: ContinueWatchingItem[] }>("/history").then((d) => setContinueWatching(d.items)).catch(() => {});
    apiFetch<{ items: VideoDTO[] }>("/videos?pageSize=12").then((d) => setFeaturedVideos(d.items)).catch(() => {});
    apiFetch<{ trainings: TrainingDTO[] }>("/trainings").then((d) => setTrainings(d.trainings.slice(0, 6))).catch(() => {});
    apiFetch<{ events: EventDTO[] }>("/events").then((d) => setEvents(upcoming(d.events))).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <BannerCarousel banners={banners} />

      <h1 className="text-2xl font-semibold text-ink-950">
        {t("welcome")}, {user?.name}
      </h1>

      {continueWatching.length > 0 && (
        <Section title={t("continueWatching")}>
          {continueWatching.map((item) => {
            const thumb = item.thumbnailUrl
              ? item.thumbnailUrl.startsWith("http")
                ? item.thumbnailUrl
                : `${API_URL}${item.thumbnailUrl}`
              : null;
            return (
              <Link key={item.videoId} href={`/videos/${item.videoId}`} className="w-48 shrink-0">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-raised">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div className="h-full bg-brand-500" style={{ width: `${item.percentualWatched}%` }} />
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm text-ink-950">{item.title}</p>
              </Link>
            );
          })}
        </Section>
      )}

      {featuredVideos.length > 0 && (
        <Section title={t("featured")}>
          {featuredVideos.map((video) => (
            <div key={video.id} className="w-40 shrink-0 sm:w-48">
              <VideoCard video={video} />
            </div>
          ))}
        </Section>
      )}

      {trainings.length > 0 && (
        <Section title={t("recentTrainings")}>
          {trainings.map((training) => (
            <Link key={training.id} href={`/trainings/${training.id}`} className="w-48 shrink-0">
              <Card className="flex h-full flex-col gap-1 p-3">
                {training.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={training.imageUrl.startsWith("http") ? training.imageUrl : `${API_URL}${training.imageUrl}`}
                    alt={training.title}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                )}
                <span className="line-clamp-1 text-sm text-ink-950">{training.title}</span>
              </Card>
            </Link>
          ))}
        </Section>
      )}

      {events.length > 0 && (
        <Section title={t("upcomingEvents")}>
          {events.map((event) => (
            <Link key={event.id} href="/events" className="w-48 shrink-0">
              <Card className="flex h-full flex-col gap-1 p-3">
                <span className="text-xs text-gold-700">{new Date(event.startDate).toLocaleDateString()}</span>
                <span className="line-clamp-2 text-sm text-ink-950">{event.title}</span>
              </Card>
            </Link>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-ink-950">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">{children}</div>
    </section>
  );
}

function upcoming(events: EventDTO[]) {
  const now = Date.now();
  return events
    .filter((e) => new Date(e.startDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 6);
}
