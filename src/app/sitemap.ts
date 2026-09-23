import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://vernexdigital.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: base + "/services", changeFrequency: "weekly", priority: 0.9 },
    { url: base + "/login", changeFrequency: "monthly", priority: 0.5 },
    { url: base + "/register", changeFrequency: "monthly", priority: 0.6 },
  ];
}
