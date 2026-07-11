import type { Locale } from "../constants/index";

export function pickLocalized(pt: string, en: string, es: string, locale: string): string;
export function pickLocalized(pt: string | null, en: string | null, es: string | null, locale: string): string | null;
export function pickLocalized(
  pt: string | null,
  en: string | null,
  es: string | null,
  locale: string
): string | null {
  switch (locale as Locale) {
    case "en-US":
      return en;
    case "es-ES":
      return es;
    default:
      return pt;
  }
}
