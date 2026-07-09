import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@vmf/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ApiError, useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await login(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError(t('auth.invalidCredentials'));
      } else {
        setFormError(t('common.error'));
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center gap-3">
          <Image source={require('@/assets/images/vmf-logo.jpg')} style={{ width: 220, height: 102 }} contentFit="contain" />
          <Text className="text-center text-sm text-ink-600">{t('auth.loginSubtitle')}</Text>
        </View>

        <View className="mb-6">
          <LanguageSwitcher />
        </View>

        {formError && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{formError}</Text>
          </View>
        )}

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label={t('auth.email')}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                label={t('auth.password')}
                secureTextEntry
                autoComplete="password"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Link href="/(auth)/forgot-password" className="self-end text-sm text-gold-700">
            {t('auth.forgotPassword')}
          </Link>

          <Button onPress={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {t('auth.submitLogin')}
          </Button>

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-ink-600">{t('auth.noAccount')}</Text>
            <Link href="/(auth)/register" className="text-sm font-medium text-gold-700">
              {t('auth.goToRegister')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
