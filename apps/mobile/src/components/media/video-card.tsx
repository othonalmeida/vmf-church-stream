import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import type { VideoDTO } from "@vmf/shared";
import { resolveMediaUrl } from "@/lib/media";

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: VideoDTO }) {
  const thumb = resolveMediaUrl(video.thumbnailUrl);
  const duration = formatDuration(video.duration);

  return (
    <View className="gap-2">
      <View className="aspect-video overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
        {thumb ? (
          <Image source={{ uri: thumb }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="play" size={32} color="#c4c4cc" />
          </View>
        )}
        {duration && (
          <View className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5">
            <Text className="text-[11px] text-white">{duration}</Text>
          </View>
        )}
        {video.transcodeStatus !== "READY" && (
          <View className="absolute left-1.5 top-1.5 rounded bg-amber-500/90 px-1.5 py-0.5">
            <Text className="text-[11px] font-medium text-black">
              {video.transcodeStatus === "FAILED" ? "Falhou" : "Processando"}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-medium text-ink-950" numberOfLines={1}>
        {video.title}
      </Text>
    </View>
  );
}
