"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "@vmf/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    try {
      await apiFetch("/auth/reset-password", { method: "POST", body: data, skipAuthRetry: true });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    }
  };

  return (
    <Card>
      <h1 className="mb-6 text-2xl font-semibold text-white">{t("resetPasswordTitle")}</h1>

      {done ? (
        <p className="text-sm text-brand-300">{t("resetPasswordSuccess")}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="hidden" {...register("token")} />
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {t("submitReset")}
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
