import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VMF Church Stream",
    short_name: "VMF Stream",
    description: "Plataforma de streaming interna da igreja: vídeos, treinamentos, conteúdos e eventos.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c14",
    theme_color: "#151434",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
