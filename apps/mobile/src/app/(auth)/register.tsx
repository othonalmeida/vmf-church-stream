import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type ChurchDTO, type Locale } from '@vmf/shared';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ApiError, useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api-client';

const formSchema = registerSchema
  .extend({ confirmPassword: z.string().min(8) })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [churches, setChurches] = useState<ChurchDTO[]>([]);

  useEffect(() => {
    apiFetch<{ churches: ChurchDTO[] }>('/churches')
      .then((d) => setChurches(d.churches))
      .catch(() => {});
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { preferredLocale: i18n.language as Locale },
  });

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    try {
      const { confirmPassword: _confirmPassword, ...input } = data;
      await registerUser(input);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('auth.emailInUse'));
      } else {
        setFormError(t('common.error'));
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center gap-1">
          <Text className="text-2xl font-semibold text-ink-950">{t('auth.registerTitle')}</Text>
          <Text className="text-center text-sm text-ink-600">{t('auth.registerSubtitle')}</Text>
        </View>

        {formError && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{formError}</Text>
          </View>
        )}

        <View className="gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                label={t('auth.name')}
                autoComplete="name"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="churchId"
            render={({ field }) => (
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-ink-700">{t('auth.church')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {churches.map((church) => (
                    <Pressable
                      key={church.id}
                      onPress={() => field.onChange(church.id)}
                      className={`rounded-full px-4 py-2 ${
                        field.value === church.id ? 'bg-ink-950' : 'bg-ink-100'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          field.value === church.id ? 'font-semibold text-white' : 'font-medium text-ink-700'
                        }`}
                      >
                        {church.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.churchId && <Text className="text-xs text-red-600">{errors.churchId.message}</Text>}
              </View>
            )}
          />
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
                autoComplete="new-password"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <TextField
                label={t('auth.confirmPassword')}
                secureTextEntry
                autoComplete="new-password"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {t('auth.submitRegister')}
          </Button>

          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-ink-600">{t('auth.hasAccount')}</Text>
            <Link href="/(auth)/login" className="text-sm font-medium text-gold-700">
              {t('auth.goToLogin')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
