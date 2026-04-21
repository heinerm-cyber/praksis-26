import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pump.no",
    short_name: "pump.no",
    description: "Kalori, kosthold og treningsplaner for en aktiv hverdag",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#0f4c81",
    lang: "no",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}