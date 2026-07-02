"use client";

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

export function AdminSidebar() {
  const t = useTranslations("adminNav");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-surface-border bg-surface-raised md:flex">
      <div className="flex items-center gap-2 border-b border-surface-border px-5 py-4 text-ink-950">
        <span className="rounded-lg bg-ink-900 px-2 py-1 text-sm text-white">VMF</span>
        <span className="text-sm font-medium">{tNav("admin")}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {ADMIN_NAV.map((item, idx) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={`${item.href}-${idx}`}
              href={item.href}
              className={cn(
                "mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-surface-border hover:text-ink-950",
                active && "bg-gold-100 text-gold-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/browse"
        className="flex items-center gap-2 border-t border-surface-border px-5 py-4 text-xs text-ink-500 hover:text-ink-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {tNav("home")}
      </Link>
    </aside>
  );
}
