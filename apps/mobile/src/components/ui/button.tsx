import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink-900",
  secondary: "bg-surface-raised border border-surface-border",
  ghost: "bg-transparent",
  danger: "bg-red-600",
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-ink-950",
  ghost: "text-ink-950",
  danger: "text-white",
};

export function Button({ variant = "primary", isLoading, disabled, children, className, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3.5 ${VARIANT_CLASSES[variant]} ${
        disabled || isLoading ? "opacity-60" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {isLoading && <ActivityIndicator size="small" color={variant === "primary" || variant === "danger" ? "#fff" : "#111"} />}
      <Text className={`text-sm font-medium ${VARIANT_TEXT_CLASSES[variant]}`}>{children}</Text>
    </Pressable>
  );
}
