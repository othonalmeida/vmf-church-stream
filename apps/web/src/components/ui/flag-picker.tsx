"use client";

import "flag-icons/css/flag-icons.min.css";
import { SUPPORTED_LOCALES } from "@vmf/shared";
import { cn } from "@/lib/cn";

const FLAG_COUNTRY: Record<string, string> = {
  "pt-BR": "br",
  "en-US": "us",
  "es-ES": "es",
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
      <div className="flex items-center gap-1.5">
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-label={l}
            title={l}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              value === l ? "bg-gold-100" : "hover:bg-surface-border"
            )}
          >
            <span className={cn("fi rounded-sm", `fi-${FLAG_COUNTRY[l]}`)} style={{ width: 22, height: 16 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
