"use client";

import { useTranslations } from "next-intl";
import { Search, ShieldCheck, LogOut } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { MEMBER_NAV_ITEMS } from "./nav-items";
import { LocaleSwitcher } from "./locale-switcher";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/cn";

export function TopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-surface-border bg-surface/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
        <Link href="/browse" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="rounded-lg bg-brand-600 px-2 py-1 text-sm">VMF</span>
          Church Stream
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {MEMBER_NAV_ITEMS.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-surface-border hover:text-white",
                pathname === item.href && "bg-surface-border text-white"
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <Link href="/search" className="rounded-lg p-2 text-white/70 hover:bg-surface-border hover:text-white">
          <Search className="h-5 w-5" />
        </Link>

        <LocaleSwitcher />

        {user?.role === "ADMIN" && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-surface-border"
          >
            <ShieldCheck className="h-4 w-4" />
            {t("admin")}
          </Link>
        )}

        <Link href="/profile" className="text-sm text-white/80 hover:text-white">
          {user?.name}
        </Link>

        <button
          onClick={() => logout()}
          className="rounded-lg p-2 text-white/60 hover:bg-surface-border hover:text-white"
          aria-label={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
