"use client";

import { useEffect, useState } from "react";
import type { BannerDTO } from "@vmf/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BannerCarousel({ banners }: { banners: BannerDTO[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  const content = (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl sm:h-64 md:h-80">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white sm:text-2xl">{banner.title}</h2>
        {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIndex((i) => (i - 1 + banners.length) % banners.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIndex((i) => (i + 1) % banners.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <span key={b.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return banner.linkUrl ? (
    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}
