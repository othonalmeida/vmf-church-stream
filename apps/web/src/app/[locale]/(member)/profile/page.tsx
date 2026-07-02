"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { SUPPORTED_LOCALES, type UpdateProfileInput } from "@vmf/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth, ApiError } from "@/contexts/auth-context";

const LOCALE_LABELS: Record<string, string> = {
  "pt-BR": "Português (BR)",
  "en-US": "English (US)",
  "es-ES": "Español (ES)",
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<UpdateProfileInput>({
    defaultValues: { name: user?.name, preferredLocale: user?.preferredLocale },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { isSubmitting: isSubmittingPassword },
  } = useForm<UpdateProfileInput>();

  const onSubmit = async (data: UpdateProfileInput) => {
    setMessage(null);
    setError(null);
    try {
      await updateProfile({ name: data.name, preferredLocale: data.preferredLocale });
      setMessage(t("saveSuccess"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  const onPasswordSubmit = async (data: UpdateProfileInput) => {
    setMessage(null);
    setError(null);
    try {
      await updateProfile({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setMessage(t("saveSuccess"));
      resetPasswordForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{t("title")}</h1>

      {message && <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <h2 className="mb-4 text-lg font-medium text-ink-950">{t("personalInfo")}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label={tAuth("name")} {...register("name")} />
          <Input label={tAuth("email")} defaultValue={user.email} disabled />
          <Select label={t("preferredLanguage")} {...register("preferredLocale")}>
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </Select>
          <Button type="submit" isLoading={isSubmitting} className="self-start">
            {tCommon("save")}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-ink-950">{t("changePassword")}</h2>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
          <Input label={tAuth("currentPassword")} type="password" {...registerPassword("currentPassword")} />
          <Input label={tAuth("newPassword")} type="password" {...registerPassword("newPassword")} />
          <Button type="submit" variant="secondary" isLoading={isSubmittingPassword} className="self-start">
            {tCommon("save")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
