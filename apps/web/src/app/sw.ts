import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, Serwist } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { OFFLINE_VIDEO_CACHE } from "@/lib/offline/cache-name";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").origin;

// Vídeos baixados para uso offline (Downloads page) sao gravados manualmente
// nesse cache via Cache Storage (ver src/lib/offline/download-video.ts). Esta
// rota garante que, sem rede, os mesmos segmentos HLS sejam servidos do cache.
const offlineVideoCaching: RuntimeCaching = {
  matcher: ({ url }) => url.origin === API_ORIGIN && url.pathname.startsWith("/media/hls/"),
  handler: new CacheFirst({ cacheName: OFFLINE_VIDEO_CACHE }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [offlineVideoCaching, ...defaultCache],
});

serwist.addEventListeners();
