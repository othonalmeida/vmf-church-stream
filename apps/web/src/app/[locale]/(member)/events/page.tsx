"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { pickLocalized, type EventDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";

export default function EventsPage() {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selected, setSelected] = useState<EventDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ events: EventDTO[] }>("/events")
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err instanceof ApiError ? err.message : tCommon("error")));
  }, [tCommon]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <EventCalendar events={events} onSelect={setSelected} />
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? pickLocalized(selected.titlePt, selected.titleEn, selected.titleEs, locale) : ""}
      >
        {selected && (
          <div className="flex flex-col gap-2 text-sm text-ink-700">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt={pickLocalized(selected.titlePt, selected.titleEn, selected.titleEs, locale)}
                className="mb-2 h-40 w-full rounded-lg object-cover"
              />
            )}
            <p>{new Date(selected.startDate).toLocaleString()}</p>
            {selected.location && <p className="text-ink-600">{selected.location}</p>}
            {pickLocalized(selected.descriptionPt, selected.descriptionEn, selected.descriptionEs, locale) && (
              <p className="whitespace-pre-line">
                {pickLocalized(selected.descriptionPt, selected.descriptionEn, selected.descriptionEs, locale)}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
