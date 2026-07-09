import { apiFetch, API_URL, ApiError } from "@/lib/api-client";
import { getDeviceId } from "./device-id";
import { OFFLINE_VIDEO_CACHE } from "./cache-name";
import { putDownloadRecord, deleteDownloadRecord, getDownloadRecord, listAllDownloadRecords } from "@/lib/idb/downloads-db";

function toAbsoluteUrl(url: string) {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function extractSegmentUrls(playlistText: string, playlistUrl: string): string[] {
  const baseUrl = playlistUrl.slice(0, playlistUrl.lastIndexOf("/") + 1);
  return playlistText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => new URL(line, baseUrl).toString());
}

export async function downloadVideoForOffline(
  video: { id: string; title: string; thumbnailUrl: string | null; hlsPlaylistUrl: string },
  userId: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (!("caches" in window)) {
    throw new Error("Este navegador não suporta downloads offline (Cache Storage indisponível).");
  }

  const deviceId = getDeviceId();
  await apiFetch("/downloads", { method: "POST", body: { videoId: video.id, deviceId } });

  const playlistUrl = toAbsoluteUrl(video.hlsPlaylistUrl);
  const playlistResponse = await fetch(playlistUrl);
  if (!playlistResponse.ok) throw new ApiError("Falha ao baixar playlist do vídeo", playlistResponse.status);
  const playlistText = await playlistResponse.clone().text();

  const segmentUrls = extractSegmentUrls(playlistText, playlistUrl);
  const allUrls = [playlistUrl, ...segmentUrls];

  const cache = await caches.open(OFFLINE_VIDEO_CACHE);
  await cache.put(playlistUrl, playlistResponse);

  let totalBytes = 0;
  for (let i = 0; i < segmentUrls.length; i++) {
    const url = segmentUrls[i];
    const response = await fetch(url);
    if (!response.ok) throw new ApiError(`Falha ao baixar segmento ${i + 1}/${segmentUrls.length}`, response.status);
    const cloned = response.clone();
    const blob = await cloned.blob();
    totalBytes += blob.size;
    await cache.put(url, response);
    onProgress?.(Math.round(((i + 1) / segmentUrls.length) * 100));
  }

  await putDownloadRecord({
    userId,
    videoId: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    deviceId,
    playlistUrl,
    cachedUrls: allUrls,
    totalBytes,
    downloadedAt: new Date().toISOString(),
  });
}

export async function removeOfflineDownload(videoId: string, userId: string): Promise<void> {
  const record = await getDownloadRecord(userId, videoId);
  if (record && "caches" in window) {
    // Se outra conta neste mesmo aparelho ainda tem esse video na propria
    // biblioteca, os segmentos continuam sendo referenciados por ela - so
    // remove do Cache Storage o que nao sobra ninguem mais precisando.
    const allRecords = await listAllDownloadRecords();
    const stillNeeded = new Set<string>();
    for (const other of allRecords) {
      if (other.userId === userId && other.videoId === videoId) continue;
      other.cachedUrls.forEach((url) => stillNeeded.add(url));
    }
    const cache = await caches.open(OFFLINE_VIDEO_CACHE);
    await Promise.all(record.cachedUrls.filter((url) => !stillNeeded.has(url)).map((url) => cache.delete(url)));
  }

  const deviceId = getDeviceId();
  await deleteDownloadRecord(userId, videoId);
  await apiFetch(`/downloads/${videoId}?deviceId=${encodeURIComponent(deviceId)}`, { method: "DELETE" });
}

export async function isVideoDownloaded(videoId: string, userId: string): Promise<boolean> {
  const record = await getDownloadRecord(userId, videoId);
  return !!record;
}
