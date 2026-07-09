import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { SupportedLocale } from '@/i18n';

const LANGUAGE_OPTIONS: { locale: SupportedLocale; flag: string }[] = [
  { locale: 'pt-BR', flag: '🇧🇷' },
  { locale: 'en-US', flag: '🇺🇸' },
  { locale: 'es-ES', flag: '🇪🇸' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <View className="flex-row justify-center gap-4">
      {LANGUAGE_OPTIONS.map((option) => (
        <Pressable
          key={option.locale}
          onPress={() => i18n.changeLanguage(option.locale)}
          hitSlop={8}
          className={`h-10 w-10 items-center justify-center rounded-full ${
            i18n.language === option.locale ? 'bg-gold-100' : ''
          }`}
        >
          <Text style={{ fontSize: 22 }}>{option.flag}</Text>
        </Pressable>
      ))}
    </View>
  );
}
