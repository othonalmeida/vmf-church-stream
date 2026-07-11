"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { pickLocalized, type FavoritableTypeName } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

interface FavoriteItem {
  id: string;
  contentType: FavoritableTypeName;
  contentId: string;
  titlePt: string;
  titleEn: string;
  titleEs: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

const TYPE_ROUTES: Record<FavoritableTypeName, string> = {
  VIDEO: "/videos",
  TRAINING: "/trainings",
  TEXT: "/texts",
  EVENT: "/events",
};

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const tSearch = useTranslations("search");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<FavoritableTypeName, string> = {
    VIDEO: tSearch("typeVideo"),
    TRAINING: tSearch("typeTraining"),
    TEXT: tSearch("typeText"),
    EVENT: tSearch("typeEvent"),
  };

  useEffect(() => {
    apiFetch<{ favorites: FavoriteItem[] }>("/favorites")
      .then((data) => setFavorites(data.favorites))
      .catch((err) => setError(err instanceof ApiError ? err.message : tCommon("error")));
  }, [tCommon]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {favorites.length === 0 && !error && <p className="text-ink-600">{t("empty")}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((item) => (
          <Link key={item.id} href={`${TYPE_ROUTES[item.contentType]}/${item.contentId}`}>
            <Card className="flex h-full flex-col gap-1 transition-colors hover:border-gold-500">
              <span className="text-xs uppercase tracking-wide text-gold-700">{typeLabels[item.contentType]}</span>
              <h3 className="font-medium text-ink-950">
                {pickLocalized(item.titlePt, item.titleEn, item.titleEs, locale)}
              </h3>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
