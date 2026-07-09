"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Tags,
  Clapperboard,
  FileText,
  GraduationCap,
  CalendarDays,
  Image,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { LocaleSwitcher } from "./locale-switcher";
import { cn } from "@/lib/cn";

const TOP_ITEMS = [{ href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard }] as const;

const CADASTRO_ITEMS = [
  { href: "/admin/categories", key: "categories", icon: Tags },
  { href: "/admin/videos", key: "videos", icon: Clapperboard },
  { href: "/admin/trainings", key: "trainings", icon: GraduationCap },
  { href: "/admin/text-contents", key: "content", icon: FileText },
  { href: "/admin/events", key: "events", icon: CalendarDays },
  { href: "/admin/banners", key: "banners", icon: Image },
] as const;

const BOTTOM_ITEMS = [
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/settings", key: "settings", icon: Settings },
] as const;

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
  indent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-surface-border hover:text-ink-950",
        indent && "ml-6",
        active && "bg-gold-100 text-gold-800"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const t = useTranslations("adminNav");
  const cadastroActive = CADASTRO_ITEMS.some((item) => pathname === item.href);
  const [cadastroOpen, setCadastroOpen] = useState(cadastroActive);

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {TOP_ITEMS.map((item) => (
        <NavItem key={item.href} href={item.href} icon={item.icon} label={t(item.key)} active={pathname === item.href} onNavigate={onNavigate} />
      ))}

      <button
        onClick={() => setCadastroOpen((open) => !open)}
        className={cn(
          "mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-surface-border hover:text-ink-950",
          cadastroActive && !cadastroOpen && "text-gold-800"
        )}
      >
        <ClipboardList className="h-4 w-4" />
        <span className="flex-1 text-left">{t("cadastro")}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cadastroOpen && "rotate-180")} />
      </button>
      {cadastroOpen &&
        CADASTRO_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={t(item.key)}
            active={pathname === item.href}
            onNavigate={onNavigate}
            indent
          />
        ))}

      <div className="my-2 border-t border-surface-border" />

      {BOTTOM_ITEMS.map((item) => (
        <NavItem key={item.href} href={item.href} icon={item.icon} label={t(item.key)} active={pathname === item.href} onNavigate={onNavigate} />
      ))}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="VMF" className="h-7 w-auto" />
          <span className="text-sm font-medium">{tNav("admin")}</span>
        </div>
        <NavLinks pathname={pathname} />
        <div className="flex items-center justify-between border-t border-surface-border px-5 py-3">
          <LocaleSwitcher />
        </div>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="VMF" className="h-7 w-auto" />
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
            <div className="flex items-center justify-between border-t border-surface-border px-5 py-3">
              <LocaleSwitcher />
            </div>
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
