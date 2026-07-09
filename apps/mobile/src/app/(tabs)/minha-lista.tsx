import type { FavoritableTypeName } from '@vmf/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ApiError, apiFetch } from '@/lib/api-client';

interface FavoriteItem {
  id: string;
  contentType: FavoritableTypeName;
  contentId: string;
  title: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export default function MinhaListaScreen() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<FavoritableTypeName, string> = {
    VIDEO: t('search.typeVideo'),
    TRAINING: t('search.typeTraining'),
    TEXT: t('search.typeText'),
    EVENT: t('search.typeEvent'),
  };

  useEffect(() => {
    apiFetch<{ favorites: FavoriteItem[] }>('/favorites')
      .then((data) => setFavorites(data.favorites))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.error')));
  }, [t]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="gap-8 p-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-semibold text-ink-950">{t('nav.myList')}</Text>

        <View className="gap-3">
          <Text className="text-lg font-medium text-ink-950">{t('favorites.title')}</Text>
          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-2">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}
          {favorites.length === 0 && !error && <Text className="text-ink-600">{t('favorites.empty')}</Text>}
          <View className="gap-3">
            {favorites.map((item) => (
              <Card key={item.id} className="gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide text-gold-700">
                  {typeLabels[item.contentType]}
                </Text>
                <Text className="font-medium text-ink-950" numberOfLines={1}>
                  {item.title}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-medium text-ink-950">{t('downloads.title')}</Text>
          <Text className="text-ink-600">{t('downloads.empty')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
