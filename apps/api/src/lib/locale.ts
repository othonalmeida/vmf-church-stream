import type { Locale as SharedLocale } from "@vmf/shared";
import type { Locale as PrismaLocale } from "@prisma/client";

const toPrismaMap: Record<SharedLocale, PrismaLocale> = {
  "pt-BR": "pt_BR",
  "en-US": "en_US",
  "es-ES": "es_ES",
};

const toSharedMap: Record<PrismaLocale, SharedLocale> = {
  pt_BR: "pt-BR",
  en_US: "en-US",
  es_ES: "es-ES",
};

export function toPrismaLocale(locale: SharedLocale): PrismaLocale {
  return toPrismaMap[locale];
}

export function toSharedLocale(locale: PrismaLocale): SharedLocale {
  return toSharedMap[locale];
}
