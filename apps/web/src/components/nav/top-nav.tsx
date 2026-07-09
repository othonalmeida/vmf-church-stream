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
        <Link href="/browse" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="VMF" className="h-9 w-auto" />
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {MEMBER_NAV_ITEMS.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-surface-border hover:text-ink-950",
                pathname === item.href && "bg-gold-100 text-gold-800"
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <Link href="/search" className="rounded-lg p-2 text-ink-600 hover:bg-surface-border hover:text-ink-950">
          <Search className="h-5 w-5" />
        </Link>

        <LocaleSwitcher />

        {user?.role === "ADMIN" && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface-border"
          >
            <ShieldCheck className="h-4 w-4" />
            {t("admin")}
          </Link>
        )}

        <Link href="/profile" className="text-sm text-ink-700 hover:text-ink-950">
          {user?.name}
        </Link>

        <button
          onClick={() => logout()}
          className="rounded-lg p-2 text-ink-500 hover:bg-surface-border hover:text-ink-950"
          aria-label={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
