"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TrainingDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TrainingsPage() {
  const t = useTranslations("trainings");
  const tCommon = useTranslations("common");
  const [trainings, setTrainings] = useState<TrainingDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ trainings: TrainingDTO[] }>("/trainings")
      .then((data) => setTrainings(data.trainings))
      .catch((err) => setError(err instanceof ApiError ? err.message : tCommon("error")));
  }, [tCommon]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {trainings.length === 0 && !error && <p className="text-ink-600">{t("empty")}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainings.map((training) => (
          <Link key={training.id} href={`/trainings/${training.id}`}>
            <Card className="flex h-full flex-col gap-3 transition-colors hover:border-gold-500">
              {training.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={training.imageUrl.startsWith("http") ? training.imageUrl : `${API_URL}${training.imageUrl}`}
                  alt={training.title}
                  className="h-32 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="font-medium text-ink-950">{training.title}</h2>
              {training.description && <p className="line-clamp-2 text-sm text-ink-600">{training.description}</p>}
              <div className="mt-auto">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${training.progressPercent ?? 0}%` }}
                  />
                </div>
                <span className="mt-1 block text-xs text-ink-500">
                  {training.progressPercent ?? 0}% {t("percentComplete")}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
