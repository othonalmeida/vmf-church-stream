"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/i18n/routing";

export function AuthGuard({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: "ADMIN";
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireRole && user.role !== requireRole) {
      router.replace("/browse");
    }
  }, [isLoading, user, requireRole, router]);

  if (isLoading || !user || (requireRole && user.role !== requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return <>{children}</>;
}
