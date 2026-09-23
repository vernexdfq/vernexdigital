import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vernex",
    short_name: "Vernex",
    description: "Connect. Verify. Grow.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1877F2",
    icons: [
      {
        src: "/vernex-icon.jpg",
        sizes: "256x256",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
