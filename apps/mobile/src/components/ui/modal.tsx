import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View className="max-h-[85%] w-full max-w-lg rounded-2xl bg-surface-raised p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="flex-1 text-lg font-semibold text-ink-950" numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} className="ml-2 rounded-lg p-1">
              <Ionicons name="close" size={20} color="#6b6b73" />
            </Pressable>
          </View>
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </RNModal>
  );
}
