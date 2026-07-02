"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  type Locale,
} from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventDTO } from "@vmf/shared";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type ViewMode = "month" | "week" | "list";

const DATE_LOCALES: Record<string, Locale> = { "pt-BR": ptBR, "en-US": enUS, "es-ES": es };

export function EventCalendar({ events, onSelect }: { events: EventDTO[]; onSelect?: (event: EventDTO) => void }) {
  const t = useTranslations("events");
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale] ?? ptBR;
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventDTO[]>();
    for (const event of events) {
      const key = format(new Date(event.startDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({ start: startOfWeek(cursor, { locale: dateLocale }), end: endOfWeek(cursor, { locale: dateLocale }) });
    }
    const start = startOfWeek(startOfMonth(cursor), { locale: dateLocale });
    const end = endOfWeek(endOfMonth(cursor), { locale: dateLocale });
    return eachDayOfInterval({ start, end });
  }, [cursor, view, dateLocale]);

  const goPrev = () => setCursor((c) => (view === "week" ? subWeeks(c, 1) : subMonths(c, 1)));
  const goNext = () => setCursor((c) => (view === "week" ? addWeeks(c, 1) : addMonths(c, 1)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-lg p-1.5 text-white/60 hover:bg-surface-border hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize text-white">
            {format(cursor, view === "week" ? "'Semana de' d MMM" : "MMMM yyyy", { locale: dateLocale })}
          </span>
          <button onClick={goNext} className="rounded-lg p-1.5 text-white/60 hover:bg-surface-border hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-raised p-1">
          {(["month", "week", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium",
                view === mode ? "bg-brand-600 text-white" : "text-white/60"
              )}
            >
              {mode === "month" ? t("month") : mode === "week" ? t("week") : t("list")}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <ul className="flex flex-col gap-2">
          {events.length === 0 && <li className="text-sm text-white/50">{t("empty")}</li>}
          {[...events]
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((event) => (
              <li
                key={event.id}
                onClick={() => onSelect?.(event)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-surface-border bg-surface-raised px-4 py-3 hover:border-brand-500"
              >
                <div>
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  {event.location && <p className="text-xs text-white/50">{event.location}</p>}
                </div>
                <span className="text-xs text-white/60">
                  {format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}
                </span>
              </li>
            ))}
        </ul>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = view === "week" || isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[84px] rounded-lg border border-surface-border p-1.5",
                  !inMonth && "opacity-30",
                  today && "border-brand-500"
                )}
              >
                <span className="text-xs text-white/60">{format(day, "d")}</span>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelect?.(event)}
                      className="truncate rounded bg-brand-600/30 px-1 py-0.5 text-left text-[10px] text-brand-200"
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && <span className="text-[10px] text-white/40">+{dayEvents.length - 2}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
