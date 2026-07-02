"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { loginSchema, type LoginInput } from "@vmf/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth, ApiError } from "@/contexts/auth-context";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await login(data);
      router.push("/browse");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError(t("invalidCredentials"));
      } else {
        setFormError(tCommon("error"));
      }
    }
  };

  return (
    <Card>
      <h1 className="mb-1 text-2xl font-semibold text-ink-950">{t("loginTitle")}</h1>
      <p className="mb-6 text-sm text-ink-600">{t("loginSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t("email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label={t("password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-gold-700 hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("submitLogin")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-gold-700 hover:underline">
          {t("goToRegister")}
        </Link>
      </p>
    </Card>
  );
}
