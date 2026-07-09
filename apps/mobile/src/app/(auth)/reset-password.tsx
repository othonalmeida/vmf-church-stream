import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@vmf/shared';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { apiFetch, ApiError } from '@/lib/api-client';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  // O link de redefinicao chega via deep link (ex: vmf://reset-password?token=...)
  // enviado por e-mail; o token vem como parametro de rota.
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: data, skipAuthRetry: true });
      setSuccess(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center gap-1">
          <Text className="text-2xl font-semibold text-ink-950">{t('auth.resetPasswordTitle')}</Text>
        </View>

        {success ? (
          <View className="gap-4">
            <View className="rounded-xl bg-emerald-50 px-4 py-3">
              <Text className="text-sm text-emerald-700">{t('auth.resetPasswordSuccess')}</Text>
            </View>
            <Link href="/(auth)/login" className="self-center text-sm font-medium text-gold-700">
              {t('auth.goToLogin')}
            </Link>
          </View>
        ) : (
          <View className="gap-4">
            {!token && (
              <View className="rounded-xl bg-amber-50 px-4 py-3">
                <Text className="text-sm text-amber-700">
                  Link inválido — abra o link de redefinição enviado por e-mail.
                </Text>
              </View>
            )}
            {formError && (
              <View className="rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-700">{formError}</Text>
              </View>
            )}
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label={t('auth.newPassword')}
                  secureTextEntry
                  autoComplete="new-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.password?.message}
                />
              )}
            />
            <Button onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} disabled={!token}>
              {t('auth.submitReset')}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
