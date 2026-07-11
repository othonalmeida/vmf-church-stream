import { pickLocalized, type EventDTO } from '@vmf/shared';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCalendar } from '@/components/calendar/event-calendar';
import { Modal } from '@/components/ui/modal';
import { ApiError, apiFetch } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';

export default function EventosScreen() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selected, setSelected] = useState<EventDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ events: EventDTO[] }>('/events')
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.error')));
  }, [t]);

  const image = resolveMediaUrl(selected?.imageUrl);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="gap-4 p-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-semibold text-ink-950">{t('events.title')}</Text>

        {error && (
          <View className="rounded-lg bg-red-50 px-4 py-2">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        )}

        <EventCalendar events={events} onSelect={setSelected} />
      </ScrollView>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? pickLocalized(selected.titlePt, selected.titleEn, selected.titleEs, i18n.language) : ''}
      >
        {selected && (
          <View className="gap-2">
            {image && (
              <Image source={{ uri: image }} style={{ width: '100%', height: 160, borderRadius: 12 }} contentFit="cover" />
            )}
            <Text className="text-sm text-ink-700">{new Date(selected.startDate).toLocaleString()}</Text>
            {selected.location && <Text className="text-sm text-ink-600">{selected.location}</Text>}
            {pickLocalized(selected.descriptionPt, selected.descriptionEn, selected.descriptionEs, i18n.language) && (
              <Text className="text-sm text-ink-700">
                {pickLocalized(selected.descriptionPt, selected.descriptionEn, selected.descriptionEs, i18n.language)}
              </Text>
            )}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
