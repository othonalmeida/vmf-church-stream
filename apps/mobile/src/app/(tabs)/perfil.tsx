import type { UpdateProfileInput } from '@vmf/shared';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ApiError, useAuth } from '@/contexts/auth-context';
import { useConfirm } from '@/contexts/confirm-context';
import { useToast } from '@/contexts/toast-context';

export default function PerfilScreen() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  const infoForm = useForm<UpdateProfileInput>({
    defaultValues: { name: user?.name, preferredLocale: user?.preferredLocale },
  });
  const passwordForm = useForm<UpdateProfileInput>({
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmitInfo = async (data: UpdateProfileInput) => {
    try {
      await updateProfile({ name: data.name, preferredLocale: i18n.language as UpdateProfileInput['preferredLocale'] });
      toast.success(t('profile.saveSuccess'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  const onSubmitPassword = async (data: UpdateProfileInput) => {
    try {
      await updateProfile({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success(t('profile.saveSuccess'));
      passwordForm.reset({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  const handleLogout = async () => {
    const ok = await confirm(t('profile.confirmLogoutMessage'), { title: t('profile.confirmLogoutTitle') });
    if (!ok) return;
    await logout();
  };

  if (!user) return null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="gap-6 p-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-semibold text-ink-950">{t('profile.title')}</Text>

        <Card className="gap-4">
          <Text className="text-lg font-medium text-ink-950">{t('profile.personalInfo')}</Text>
          <Controller
            control={infoForm.control}
            name="name"
            render={({ field }) => (
              <TextField label={t('auth.name')} value={field.value} onChangeText={field.onChange} />
            )}
          />
          <TextField label={t('auth.email')} value={user.email} editable={false} />

          <View>
            <Text className="mb-2 text-sm font-medium text-ink-700">{t('profile.preferredLanguage')}</Text>
            <LanguageSwitcher />
          </View>

          <Button onPress={infoForm.handleSubmit(onSubmitInfo)} isLoading={infoForm.formState.isSubmitting} className="self-start">
            {t('common.save')}
          </Button>
        </Card>

        <Card className="gap-4">
          <Text className="text-lg font-medium text-ink-950">{t('profile.changePassword')}</Text>
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field }) => (
              <TextField
                label={t('auth.currentPassword')}
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field }) => (
              <TextField
                label={t('auth.newPassword')}
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Button
            variant="secondary"
            onPress={passwordForm.handleSubmit(onSubmitPassword)}
            isLoading={passwordForm.formState.isSubmitting}
            className="self-start"
          >
            {t('common.save')}
          </Button>
        </Card>

        <Button variant="danger" onPress={handleLogout}>
          {t('nav.logout')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
