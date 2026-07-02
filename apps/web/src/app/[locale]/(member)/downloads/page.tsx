"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, WifiOff } from "lucide-react";
import { listDownloadRecords, type DownloadRecord } from "@/lib/idb/downloads-db";
import { removeOfflineDownload } from "@/lib/offline/download-video";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DownloadsPage() {
  const t = useTranslations("downloads");
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  const load = () => {
    listDownloadRecords().then(setDownloads);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (videoId: string) => {
    await removeOfflineDownload(videoId);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>
      <p className="flex items-center gap-1.5 text-xs text-ink-500">
        <WifiOff className="h-3.5 w-3.5" />
        {t("subtitle")}
      </p>

      {downloads.length === 0 && <p className="text-ink-600">{t("empty")}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {downloads.map((d) => {
          const thumb = d.thumbnailUrl ? (d.thumbnailUrl.startsWith("http") ? d.thumbnailUrl : `${API_URL}${d.thumbnailUrl}`) : null;
          return (
            <Card key={d.videoId} className="flex flex-col gap-2">
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={d.title} className="h-32 w-full rounded-lg object-cover" />
              )}
              <Link href={`/videos/${d.videoId}`} className="font-medium text-ink-950 hover:underline">
                {d.title}
              </Link>
              <span className="text-xs text-ink-500">{(d.totalBytes / (1024 * 1024)).toFixed(1)} MB</span>
              <button
                onClick={() => handleRemove(d.videoId)}
                className="mt-auto flex items-center gap-1.5 self-start rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-600 hover:bg-red-100 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("remove")}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
