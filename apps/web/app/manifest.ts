import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Integrate",
    short_name: "Integrate",
    description: "AI-native notes and study tools for every subject",
    start_url: "/",
    display: "standalone",
    background_color: "#edf7ff",
    theme_color: "#1677c8",
    icons: [
      {
        src: "/integrate-mark.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
