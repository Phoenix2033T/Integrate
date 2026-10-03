import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Integrate",
    short_name: "Integrate",
    description: "AI-native notes and study tools for every subject",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#17191d",
    icons: [
      {
        src: "/integrate-mark.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
