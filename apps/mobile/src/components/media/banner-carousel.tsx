import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { BannerDTO } from "@vmf/shared";

export function BannerCarousel({ banners }: { banners: BannerDTO[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[index];

  return (
    <View className="h-56 w-full overflow-hidden rounded-2xl bg-surface-raised">
      <Image source={{ uri: banner.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      <View className="absolute inset-0 justify-end bg-black/40 p-5">
        <Text className="text-xl font-bold leading-tight text-white" numberOfLines={2}>
          {banner.title}
        </Text>
        {banner.subtitle && (
          <Text className="mt-1.5 text-sm text-white/85" numberOfLines={2}>
            {banner.subtitle}
          </Text>
        )}
      </View>

      {banners.length > 1 && (
        <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
          {banners.map((b, i) => (
            <Pressable key={b.id} onPress={() => setIndex(i)} hitSlop={6}>
              <View className={`h-1.5 rounded-full ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
