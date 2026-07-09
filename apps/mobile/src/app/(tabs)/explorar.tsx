import type { CategoryDTO, TextContentDTO, TrainingDTO, VideoDTO } from '@vmf/shared';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoCard } from '@/components/media/video-card';
import { Card } from '@/components/ui/card';
import { ApiError, apiFetch } from '@/lib/api-client';
import { categoryName } from '@/lib/category-name';
import { resolveMediaUrl } from '@/lib/media';

type Segment = 'videos' | 'trainings' | 'texts';
const SEGMENTS: Segment[] = ['videos', 'trainings', 'texts'];

export default function ExplorarScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('videos');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <View className="flex-row gap-2 px-6 pb-4 pt-2">
        {SEGMENTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSegment(s)}
            className={`flex-1 items-center rounded-full py-2 ${
              segment === s ? 'bg-ink-900' : 'border border-surface-border bg-surface-raised'
            }`}
          >
            <Text className={`text-sm font-medium ${segment === s ? 'text-white' : 'text-ink-600'}`}>
              {t(`${s}.title`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {segment === 'videos' && <VideosTab />}
      {segment === 'trainings' && <TrainingsTab />}
      {segment === 'texts' && <TextsTab />}
    </SafeAreaView>
  );
}

function EmptyOrError({ isLoading, error, empty }: { isLoading: boolean; error: string | null; empty: string }) {
  if (error) {
    return (
      <View className="mx-6 rounded-lg bg-red-50 px-4 py-2">
        <Text className="text-sm text-red-700">{error}</Text>
      </View>
    );
  }
  if (isLoading) return null;
  return (
    <View className="px-6">
      <Text className="text-ink-600">{empty}</Text>
    </View>
  );
}

function CategoryChips({
  categories,
  categoryId,
  onSelect,
  allLabel,
  locale,
}: {
  categories: CategoryDTO[];
  categoryId: string;
  onSelect: (id: string) => void;
  allLabel: string;
  locale: string;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, height: 52 }}
      data={[{ id: '', label: allLabel }, ...categories.map((c) => ({ id: c.id, label: categoryName(c, locale) }))]}
      keyExtractor={(item) => item.id || 'all'}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 24, alignItems: 'center' }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item.id)}
          className={`shrink-0 rounded-full px-4 py-2 ${categoryId === item.id ? 'bg-ink-950' : 'bg-ink-100'}`}
        >
          <Text className={`text-sm ${categoryId === item.id ? 'font-semibold text-white' : 'font-medium text-ink-700'}`}>
            {item.label}
          </Text>
        </Pressable>
      )}
    />
  );
}

function VideosTab() {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ categories: CategoryDTO[] }>('/categories?contentType=VIDEO')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ pageSize: '60' });
    if (categoryId) params.set('categoryId', categoryId);
    apiFetch<{ items: VideoDTO[] }>(`/videos?${params.toString()}`)
      .then((d) => setVideos(d.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.error')))
      .finally(() => setIsLoading(false));
  }, [categoryId, t]);

  return (
    <View className="flex-1">
      <CategoryChips
        categories={categories}
        categoryId={categoryId}
        onSelect={setCategoryId}
        allLabel={t('videos.all')}
        locale={i18n.language}
      />
      <EmptyOrError isLoading={isLoading} error={error} empty={t('videos.empty')} />
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ gap: 16, padding: 24 }}
        renderItem={({ item }) => (
          <View className="flex-1">
            <VideoCard video={item} />
          </View>
        )}
      />
    </View>
  );
}

function TrainingsTab() {
  const { t } = useTranslation();
  const [trainings, setTrainings] = useState<TrainingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ trainings: TrainingDTO[] }>('/trainings')
      .then((d) => setTrainings(d.trainings))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.error')))
      .finally(() => setIsLoading(false));
  }, [t]);

  return (
    <View className="flex-1">
      <EmptyOrError isLoading={isLoading} error={error} empty={t('trainings.empty')} />
      <FlatList
        data={trainings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, padding: 24 }}
        renderItem={({ item }) => {
          const image = resolveMediaUrl(item.imageUrl);
          const progress = item.progressPercent ?? 0;
          return (
            <Card className="gap-2">
              {image && (
                <Image source={{ uri: image }} style={{ width: '100%', height: 140, borderRadius: 8 }} contentFit="cover" />
              )}
              <Text className="font-medium text-ink-950">{item.title}</Text>
              {item.description && (
                <Text className="text-sm text-ink-600" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                <View className="h-full bg-gold-500" style={{ width: `${progress}%` }} />
              </View>
              <Text className="text-xs text-ink-500">
                {progress}% {t('trainings.percentComplete')}
              </Text>
            </Card>
          );
        }}
      />
    </View>
  );
}

function TextsTab() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<TextContentDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ items: TextContentDTO[] }>('/text-contents?pageSize=50'),
      apiFetch<{ categories: CategoryDTO[] }>('/categories?contentType=TEXT'),
    ])
      .then(([contents, cats]) => {
        setItems(contents.items);
        setCategories(cats.categories);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.error')))
      .finally(() => setIsLoading(false));
  }, [t]);

  const findCategoryName = (id: string) => {
    const category = categories.find((c) => c.id === id);
    return category ? categoryName(category, i18n.language) : '';
  };

  return (
    <View className="flex-1">
      <EmptyOrError isLoading={isLoading} error={error} empty={t('texts.empty')} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ gap: 16, padding: 24 }}
        renderItem={({ item }) => {
          const image = resolveMediaUrl(item.imageUrl);
          return (
            <Card className="flex-1 gap-1.5">
              {image && (
                <Image source={{ uri: image }} style={{ width: '100%', height: 96, borderRadius: 8 }} contentFit="cover" />
              )}
              <Text className="text-xs font-medium uppercase tracking-wide text-gold-700">
                {findCategoryName(item.categoryId)}
              </Text>
              <Text className="font-medium text-ink-950" numberOfLines={1}>
                {item.title}
              </Text>
              {item.description && (
                <Text className="text-sm text-ink-600" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}
