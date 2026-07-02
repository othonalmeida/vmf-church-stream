"use client";

import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@vmf/shared";
import { usePathname, useRouter } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  "pt-BR": "Português (BR)",
  "en-US": "English (US)",
  "es-ES": "Español (ES)",
};

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      aria-label={t("language")}
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      className="rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs text-white outline-none"
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
