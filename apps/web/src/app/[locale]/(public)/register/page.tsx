"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { z } from "zod";
import { registerSchema } from "@vmf/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth, ApiError } from "@/contexts/auth-context";

const formSchema = registerSchema
  .extend({ confirmPassword: z.string().min(8) })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { preferredLocale: locale as FormValues["preferredLocale"] },
  });

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    try {
      const { confirmPassword: _confirmPassword, ...input } = data;
      await registerUser(input);
      router.push("/browse");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t("emailInUse"));
      } else {
        setFormError(tCommon("error"));
      }
    }
  };

  return (
    <Card>
      <h1 className="mb-1 text-2xl font-semibold text-ink-950">{t("registerTitle")}</h1>
      <p className="mb-6 text-sm text-ink-600">{t("registerSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label={t("name")} autoComplete="name" error={errors.name?.message} {...register("name")} />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label={t("confirmPassword")}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("submitRegister")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-gold-700 hover:underline">
          {t("goToLogin")}
        </Link>
      </p>
    </Card>
  );
}
