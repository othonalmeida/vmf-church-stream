"use client";

import { SUPPORTED_LOCALES } from "@vmf/shared";
import { cn } from "@/lib/cn";

const FLAGS: Record<string, string> = {
  "pt-BR": "🇧🇷",
  "en-US": "🇺🇸",
  "es-ES": "🇪🇸",
};

export function FlagPicker({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (locale: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-ink-700">{label}</span>}
      <div className="flex items-center gap-1">
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-label={l}
            title={l}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors",
              value === l ? "bg-gold-100" : "hover:bg-surface-border"
            )}
          >
            {FLAGS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
