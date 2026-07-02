import { cn } from "@/lib/cn";

type BadgeTone = "success" | "neutral" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-emerald-500/15 text-emerald-300",
  neutral: "bg-white/10 text-white/70",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}
