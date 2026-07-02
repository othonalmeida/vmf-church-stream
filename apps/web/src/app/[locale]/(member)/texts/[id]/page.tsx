"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { TextContentDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export default function TextDetailPage() {
  const tCommon = useTranslations("common");
  const params = useParams<{ id: string }>();
  const [content, setContent] = useState<TextContentDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ content: TextContentDTO }>(`/text-contents/${params.id}`);
        setContent(data.content);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tCommon("error"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (error) {
    return <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>;
  }

  if (!content) {
    return <p className="text-white/60">{tCommon("loading")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/texts" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      {content.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.imageUrl} alt={content.title} className="h-56 w-full rounded-2xl object-cover" />
      )}

      <h1 className="text-3xl font-semibold text-white">{content.title}</h1>
      {content.description && <p className="text-white/60">{content.description}</p>}

      <Card>
        {/* contentHtml e sanitizado no backend (sanitize-html com allowlist) antes de ser persistido. */}
        <div
          className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/80 prose-a:text-brand-300"
          dangerouslySetInnerHTML={{ __html: content.contentHtml }}
        />
      </Card>
    </div>
  );
}
