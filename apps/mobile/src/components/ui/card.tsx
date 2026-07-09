import { View, type ViewProps } from "react-native";

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-xl border border-surface-border bg-surface-raised p-3 ${className ?? ""}`}
      {...props}
    />
  );
}
