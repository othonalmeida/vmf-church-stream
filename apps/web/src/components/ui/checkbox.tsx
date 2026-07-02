"use client";

import { forwardRef } from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, id, ...props }, ref) => {
  const checkboxId = id || props.name;
  return (
    <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm text-white/80">
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className="h-4 w-4 rounded border-surface-border bg-surface-raised text-brand-600 focus:ring-brand-500"
        {...props}
      />
      {label}
    </label>
  );
});
Checkbox.displayName = "Checkbox";
