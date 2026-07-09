"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { FlagPicker } from "@/components/ui/flag-picker";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return <FlagPicker value={locale} onChange={(l) => router.replace(pathname, { locale: l })} />;
}
