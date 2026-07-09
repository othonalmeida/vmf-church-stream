import { Ionicons } from "@expo/vector-icons";
import type { EventDTO } from "@vmf/shared";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  type Locale,
} from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type ViewMode = "month" | "week" | "list";

const DATE_LOCALES: Record<string, Locale> = { "pt-BR": ptBR, "en-US": enUS, "es-ES": es };

export function EventCalendar({
  events,
  onSelect,
}: {
  events: EventDTO[];
  onSelect: (event: EventDTO) => void;
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? ptBR;
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
      return eachDayOfInterval({
        start: startOfWeek(cursor, { locale: dateLocale }),
        end: endOfWeek(cursor, { locale: dateLocale }),
      });
    }
    const start = startOfWeek(startOfMonth(cursor), { locale: dateLocale });
    const end = endOfWeek(endOfMonth(cursor), { locale: dateLocale });
    return eachDayOfInterval({ start, end });
  }, [cursor, view, dateLocale]);

  const weekdayLabels = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { locale: dateLocale });
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { locale: dateLocale }) }).map((d) =>
      format(d, "EEEEE", { locale: dateLocale }),
    );
  }, [dateLocale]);

  const goPrev = () => setCursor((c) => (view === "week" ? subWeeks(c, 1) : subMonths(c, 1)));
  const goNext = () => setCursor((c) => (view === "week" ? addWeeks(c, 1) : addMonths(c, 1)));

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={goPrev} hitSlop={8} className="rounded-lg p-1.5">
            <Ionicons name="chevron-back" size={18} color="#4b5563" />
          </Pressable>
          <Text className="min-w-[120px] text-center text-sm font-medium capitalize text-ink-950">
            {format(cursor, view === "week" ? "'Semana de' d MMM" : "MMMM yyyy", { locale: dateLocale })}
          </Text>
          <Pressable onPress={goNext} hitSlop={8} className="rounded-lg p-1.5">
            <Ionicons name="chevron-forward" size={18} color="#4b5563" />
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-1 rounded-lg bg-surface p-1">
        {(["month", "week", "list"] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setView(mode)}
            className={`flex-1 items-center rounded-md py-1.5 ${view === mode ? "bg-ink-900" : ""}`}
          >
            <Text className={`text-xs font-medium ${view === mode ? "text-white" : "text-ink-600"}`}>
              {mode === "month" ? t("events.month") : mode === "week" ? t("events.week") : t("events.list")}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "list" ? (
        <View className="gap-2">
          {events.length === 0 && <Text className="text-sm text-ink-500">{t("events.empty")}</Text>}
          {[...events]
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((event) => (
              <Pressable
                key={event.id}
                onPress={() => onSelect(event)}
                className="flex-row items-center justify-between rounded-xl border border-surface-border bg-surface-raised px-4 py-3"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-medium text-ink-950" numberOfLines={1}>
                    {event.title}
                  </Text>
                  {event.location && (
                    <Text className="text-xs text-ink-500" numberOfLines={1}>
                      {event.location}
                    </Text>
                  )}
                </View>
                <Text className="text-xs text-ink-600">{format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}</Text>
              </Pressable>
            ))}
        </View>
      ) : (
        <View>
          <View className="flex-row">
            {weekdayLabels.map((label, i) => (
              <View key={i} style={{ width: "14.2857%" }} className="items-center pb-1">
                <Text className="text-[11px] uppercase text-ink-400">{label}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) ?? [];
              const inMonth = view === "week" || isSameMonth(day, cursor);
              const today = isSameDay(day, new Date());
              return (
                <View key={key} style={{ width: "14.2857%" }} className="p-0.5">
                  <View
                    style={{ minHeight: 72 }}
                    className={`rounded-lg border p-1 ${today ? "border-gold-500" : "border-surface-border"} ${
                      !inMonth ? "opacity-30" : ""
                    }`}
                  >
                    <Text className="text-xs text-ink-600">{format(day, "d")}</Text>
                    <View className="mt-1 gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <Pressable key={event.id} onPress={() => onSelect(event)} className="rounded bg-gold-100 px-1 py-0.5">
                          <Text className="text-[9px] text-gold-800" numberOfLines={1}>
                            {event.title}
                          </Text>
                        </Pressable>
                      ))}
                      {dayEvents.length > 2 && (
                        <Text className="text-[9px] text-ink-400">+{dayEvents.length - 2}</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
