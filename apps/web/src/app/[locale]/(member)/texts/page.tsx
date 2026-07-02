"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { TextContentDTO, CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { categoryName } from "@/lib/category-name";

interface PaginatedTextContents {
  items: TextContentDTO[];
}

export default function TextsPage() {
  const t = useTranslations("texts");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [items, setItems] = useState<TextContentDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [contents, cats] = await Promise.all([
          apiFetch<PaginatedTextContents>("/text-contents?pageSize=50"),
          apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=TEXT"),
        ]);
        setItems(contents.items);
        setCategories(cats.categories);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tCommon("error"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tCommon]);

  const findCategoryName = (id: string) => {
    const category = categories.find((c) => c.id === id);
    return category ? categoryName(category, locale) : "";
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {isLoading && <p className="text-ink-600">{tCommon("loading")}</p>}
      {!isLoading && items.length === 0 && <p className="text-ink-600">{t("empty")}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/texts/${item.id}`}>
            <Card className="flex h-full flex-col gap-2 transition-colors hover:border-gold-500">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="mb-2 h-32 w-full rounded-lg object-cover" />
              )}
              <span className="text-xs uppercase tracking-wide text-gold-700">{findCategoryName(item.categoryId)}</span>
              <h2 className="font-medium text-ink-950">{item.title}</h2>
              {item.description && <p className="line-clamp-2 text-sm text-ink-600">{item.description}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
