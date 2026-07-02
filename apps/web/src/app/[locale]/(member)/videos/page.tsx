"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { VideoDTO, CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { VideoCard } from "@/components/media/video-card";
import { categoryName } from "@/lib/category-name";

interface PaginatedVideos {
  items: VideoDTO[];
}

export default function VideosPage() {
  const t = useTranslations("videos");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cats = await apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=VIDEO");
        setCategories(cats.categories);
      } catch {
        // categories are optional for filtering; ignore failures here
      }
    })();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ pageSize: "60" });
    if (categoryId) params.set("categoryId", categoryId);
    apiFetch<PaginatedVideos>(`/videos?${params.toString()}`)
      .then((data) => setVideos(data.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : tCommon("error")))
      .finally(() => setIsLoading(false));
  }, [categoryId, tCommon]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryId("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              categoryId === "" ? "bg-ink-900 text-ink-950" : "bg-surface-raised text-ink-600 border border-surface-border"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                categoryId === c.id ? "bg-ink-900 text-ink-950" : "bg-surface-raised text-ink-600 border border-surface-border"
              }`}
            >
              {categoryName(c, locale)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {isLoading && <p className="text-ink-600">{t("loading")}</p>}
      {!isLoading && videos.length === 0 && <p className="text-ink-600">{t("empty")}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
