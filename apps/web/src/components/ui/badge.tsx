import { cn } from "@/lib/cn";

type BadgeTone = "success" | "neutral" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  neutral: "bg-ink-100 text-ink-600",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}
