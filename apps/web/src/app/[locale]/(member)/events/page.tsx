"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { EventDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";

export default function EventsPage() {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
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
      <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
      {error && <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>}

      <Card>
        <EventCalendar events={events} onSelect={setSelected} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
        {selected && (
          <div className="flex flex-col gap-2 text-sm text-white/80">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} className="mb-2 h-40 w-full rounded-lg object-cover" />
            )}
            <p>{new Date(selected.startDate).toLocaleString()}</p>
            {selected.location && <p className="text-white/60">{selected.location}</p>}
            {selected.description && <p className="whitespace-pre-line">{selected.description}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
