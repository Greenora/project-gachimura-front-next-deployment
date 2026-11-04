import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "가치무라",
    short_name: "가치무라",
    description: "함께 장보고 생활비 아끼자!",
    lang: "ko-KR",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#166534",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
