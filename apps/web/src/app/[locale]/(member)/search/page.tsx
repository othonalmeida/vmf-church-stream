"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search as SearchIcon } from "lucide-react";
import type { CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { Checkbox } from "@/components/ui/checkbox";
import { categoryName } from "@/lib/category-name";

interface SearchResultItem {
  id: string;
  type: "VIDEO" | "TRAINING" | "TEXT" | "EVENT";
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
}

const TYPE_ROUTES: Record<SearchResultItem["type"], string> = {
  VIDEO: "/videos",
  TRAINING: "/trainings",
  TEXT: "/texts",
  EVENT: "/events",
};

export default function SearchPage() {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<SearchResultItem["type"], string> = {
    VIDEO: t("typeVideo"),
    TRAINING: t("typeTraining"),
    TEXT: t("typeText"),
    EVENT: t("typeEvent"),
  };

  useEffect(() => {
    apiFetch<{ categories: CategoryDTO[] }>("/categories").then((data) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    if (offlineOnly) params.set("offlineOnly", "true");

    const handle = setTimeout(() => {
      apiFetch<{ results: SearchResultItem[] }>(`/search?${params.toString()}`)
        .then((data) => setResults(data.results))
        .catch((err) => setError(err instanceof ApiError ? err.message : tCommon("error")));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, categoryId, offlineOnly, tCommon]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{tCommon("search")}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder={t("placeholder")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryName(c, locale)}
            </option>
          ))}
        </Select>
        <Checkbox label={t("offlineOnly")} checked={offlineOnly} onChange={(e) => setOfflineOnly(e.target.checked)} />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <Link key={`${item.type}-${item.id}`} href={`${TYPE_ROUTES[item.type]}/${item.id}`}>
            <Card className="flex h-full flex-col gap-1 transition-colors hover:border-gold-500">
              <span className="text-xs uppercase tracking-wide text-gold-700">{typeLabels[item.type]}</span>
              <h3 className="font-medium text-ink-950">{item.title}</h3>
              {item.description && <p className="line-clamp-2 text-sm text-ink-600">{item.description}</p>}
            </Card>
          </Link>
        ))}
        {results.length === 0 && <p className="text-ink-600">{t("empty")}</p>}
      </div>
    </div>
  );
}
