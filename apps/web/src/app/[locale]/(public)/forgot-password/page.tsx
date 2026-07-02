"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@vmf/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await apiFetch("/auth/forgot-password", { method: "POST", body: data, skipAuthRetry: true });
    setSent(true);
  };

  return (
    <Card>
      <h1 className="mb-1 text-2xl font-semibold text-white">{t("forgotPasswordTitle")}</h1>
      <p className="mb-6 text-sm text-white/60">{t("forgotPasswordSubtitle")}</p>

      {sent ? (
        <p className="text-sm text-brand-300">{t("resetLinkSent")}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t("email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {t("sendResetLink")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-white/60">
        <Link href="/login" className="text-brand-300 hover:underline">
          {t("goToLogin")}
        </Link>
      </p>
    </Card>
  );
}
