"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Tags,
  Clapperboard,
  Captions,
  FileText,
  GraduationCap,
  CalendarDays,
  Image,
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const ADMIN_NAV = [
  { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/categories", key: "categories", icon: Tags },
  { href: "/admin/videos", key: "videos", icon: Clapperboard },
  { href: "/admin/videos", key: "subtitles", icon: Captions },
  { href: "/admin/text-contents", key: "content", icon: FileText },
  { href: "/admin/trainings", key: "trainings", icon: GraduationCap },
  { href: "/admin/events", key: "events", icon: CalendarDays },
  { href: "/admin/banners", key: "banners", icon: Image },
  { href: "/admin/dashboard", key: "reports", icon: BarChart3 },
  { href: "/admin/settings", key: "settings", icon: Settings },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const t = useTranslations("adminNav");
  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {ADMIN_NAV.map((item, idx) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={`${item.href}-${idx}`}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-surface-border hover:text-ink-950",
              active && "bg-gold-100 text-gold-800"
            )}
          >
            <Icon className="h-4 w-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-surface-border bg-surface-raised md:flex">
        <div className="flex items-center gap-2 border-b border-surface-border px-5 py-4 text-ink-950">
          <span className="rounded-lg bg-ink-900 px-2 py-1 text-sm text-white">VMF</span>
          <span className="text-sm font-medium">{tNav("admin")}</span>
        </div>
        <NavLinks pathname={pathname} />
        <Link
          href="/browse"
          className="flex items-center gap-2 border-t border-surface-border px-5 py-4 text-xs text-ink-500 hover:text-ink-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tNav("home")}
        </Link>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface-raised px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 text-ink-950">
          <span className="rounded-lg bg-ink-900 px-2 py-1 text-sm text-white">VMF</span>
          <span className="text-sm font-medium">{tNav("admin")}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-ink-600 hover:bg-surface-border hover:text-ink-950"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-surface-raised shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <span className="text-sm font-medium text-ink-950">{tNav("admin")}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-surface-border hover:text-ink-950"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <Link
              href="/browse"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 border-t border-surface-border px-5 py-4 text-xs text-ink-500 hover:text-ink-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {tNav("home")}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
