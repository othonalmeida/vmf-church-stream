import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";
import ptBR from "./locales/pt-BR.json";

export const SUPPORTED_LOCALES = ["pt-BR", "en-US", "es-ES"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = "pt-BR";

function resolveDeviceLocale(): SupportedLocale {
  const deviceTag = Localization.getLocales()[0]?.languageTag;
  const match = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === deviceTag?.toLowerCase());
  if (match) return match;
  // Sem correspondencia exata (ex: "pt-PT" ou "en-GB"), tenta so pelo idioma base.
  const baseLang = deviceTag?.split("-")[0];
  const byLanguage = SUPPORTED_LOCALES.find((locale) => locale.split("-")[0] === baseLang);
  return byLanguage ?? DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    "en-US": { translation: enUS },
    "es-ES": { translation: esES },
  },
  lng: resolveDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
