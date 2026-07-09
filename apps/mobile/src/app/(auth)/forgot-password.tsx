import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@vmf/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { apiFetch, ApiError } from '@/lib/api-client';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormError(null);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: data, skipAuthRetry: true });
      setSent(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center gap-1">
          <Text className="text-2xl font-semibold text-ink-950">{t('auth.forgotPasswordTitle')}</Text>
          <Text className="text-center text-sm text-ink-600">{t('auth.forgotPasswordSubtitle')}</Text>
        </View>

        {sent ? (
          <View className="rounded-xl bg-emerald-50 px-4 py-3">
            <Text className="text-sm text-emerald-700">{t('auth.resetLinkSent')}</Text>
          </View>
        ) : (
          <View className="gap-4">
            {formError && (
              <View className="rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-700">{formError}</Text>
              </View>
            )}
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
            <Button onPress={handleSubmit(onSubmit)} isLoading={isSubmitting}>
              {t('auth.sendResetLink')}
            </Button>
          </View>
        )}

        <Link href="/(auth)/login" className="mt-6 self-center text-sm font-medium text-gold-700">
          {t('auth.goToLogin')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
