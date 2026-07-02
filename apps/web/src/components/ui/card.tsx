import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl", className)}
      {...props}
    />
  );
}
