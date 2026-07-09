import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, className, secureTextEntry, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPasswordField = secureTextEntry === true;

    return (
      <View className="gap-1.5">
        {label && <Text className="text-sm font-medium text-ink-700">{label}</Text>}
        <View className="relative justify-center">
          <TextInput
            ref={ref}
            className={`rounded-xl border bg-surface-raised px-3.5 py-3 text-sm text-ink-950 ${
              isPasswordField ? "pr-11" : ""
            } ${error ? "border-red-500" : "border-surface-border"} ${className ?? ""}`}
            placeholderTextColor="#8e8e96"
            secureTextEntry={isPasswordField ? !isPasswordVisible : secureTextEntry}
            {...props}
          />
          {isPasswordField && (
            <Pressable
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              hitSlop={8}
              className="absolute right-3"
            >
              <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#8e8e96" />
            </Pressable>
          )}
        </View>
        {error && <Text className="text-xs text-red-600">{error}</Text>}
      </View>
    );
  },
);
TextField.displayName = "TextField";
