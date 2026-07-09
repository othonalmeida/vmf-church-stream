import { Ionicons } from '@expo/vector-icons';
import type { BannerDTO, EventDTO, TrainingDTO, VideoDTO } from '@vmf/shared';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/media/banner-carousel';
import { VideoCard } from '@/components/media/video-card';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';

interface ContinueWatchingItem {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  percentualWatched: number;
}

function upcoming(events: EventDTO[]) {
  const now = Date.now();
  return events
    .filter((e) => new Date(e.startDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 6);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="px-6 text-lg font-medium text-ink-950">{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-6">
        {children}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoDTO[]>([]);
  const [trainings, setTrainings] = useState<TrainingDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);

  useEffect(() => {
    apiFetch<{ banners: BannerDTO[] }>('/banners').then((d) => setBanners(d.banners)).catch(() => {});
    apiFetch<{ items: ContinueWatchingItem[] }>('/history').then((d) => setContinueWatching(d.items)).catch(() => {});
    apiFetch<{ items: VideoDTO[] }>('/videos?pageSize=12').then((d) => setFeaturedVideos(d.items)).catch(() => {});
    apiFetch<{ trainings: TrainingDTO[] }>('/trainings').then((d) => setTrainings(d.trainings.slice(0, 6))).catch(() => {});
    apiFetch<{ events: EventDTO[] }>('/events').then((d) => setEvents(upcoming(d.events))).catch(() => {});
  }, []);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="gap-8 pb-10" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View>
            <Text className="text-xs text-ink-500">{t('home.welcome')}</Text>
            <Text className="text-lg font-semibold text-ink-950">{user?.name}</Text>
          </View>
          <Ionicons name="search" size={24} color="#28282f" />
        </View>

        <View className="px-6">
          <BannerCarousel banners={banners} />
        </View>

        {continueWatching.length > 0 && (
          <Section title={t('home.continueWatching')}>
            {continueWatching.map((item) => {
              const thumb = resolveMediaUrl(item.thumbnailUrl);
              return (
                <View key={item.videoId} className="w-48 gap-1.5">
                  <View className="aspect-video overflow-hidden rounded-xl bg-surface-raised">
                    {thumb && (
                      <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    )}
                    <View className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <View className="h-full bg-gold-500" style={{ width: `${item.percentualWatched}%` }} />
                    </View>
                  </View>
                  <Text className="text-sm text-ink-950" numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
              );
            })}
          </Section>
        )}

        {featuredVideos.length > 0 && (
          <Section title={t('home.featured')}>
            {featuredVideos.map((video) => (
              <View key={video.id} className="w-40">
                <VideoCard video={video} />
              </View>
            ))}
          </Section>
        )}

        {trainings.length > 0 && (
          <Section title={t('home.recentTrainings')}>
            {trainings.map((training) => {
              const image = resolveMediaUrl(training.imageUrl);
              return (
                <Card key={training.id} className="w-48 gap-1.5">
                  {image && (
                    <Image
                      source={{ uri: image }}
                      style={{ width: '100%', height: 96, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  )}
                  <Text className="text-sm text-ink-950" numberOfLines={1}>
                    {training.title}
                  </Text>
                </Card>
              );
            })}
          </Section>
        )}

        {events.length > 0 && (
          <Section title={t('home.upcomingEvents')}>
            {events.map((event) => (
              <Card key={event.id} className="w-48 gap-1.5">
                <Text className="text-xs text-gold-700">{new Date(event.startDate).toLocaleDateString()}</Text>
                <Text className="text-sm text-ink-950" numberOfLines={2}>
                  {event.title}
                </Text>
              </Card>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
