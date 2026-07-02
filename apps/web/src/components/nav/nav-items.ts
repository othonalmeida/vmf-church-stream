import type { LucideIcon } from "lucide-react";
import { Home, Clapperboard, GraduationCap, FileText, CalendarDays, Download, Heart, User } from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: "home" | "videos" | "trainings" | "content" | "events" | "downloads" | "favorites" | "profile";
  icon: LucideIcon;
}

export const MEMBER_NAV_ITEMS: NavItem[] = [
  { href: "/browse", labelKey: "home", icon: Home },
  { href: "/videos", labelKey: "videos", icon: Clapperboard },
  { href: "/trainings", labelKey: "trainings", icon: GraduationCap },
  { href: "/texts", labelKey: "content", icon: FileText },
  { href: "/events", labelKey: "events", icon: CalendarDays },
  { href: "/downloads", labelKey: "downloads", icon: Download },
  { href: "/favorites", labelKey: "favorites", icon: Heart },
  { href: "/profile", labelKey: "profile", icon: User },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/browse", labelKey: "home", icon: Home },
  { href: "/videos", labelKey: "videos", icon: Clapperboard },
  { href: "/trainings", labelKey: "trainings", icon: GraduationCap },
  { href: "/events", labelKey: "events", icon: CalendarDays },
  { href: "/profile", labelKey: "profile", icon: User },
];
