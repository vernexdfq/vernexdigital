import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.vernexdigital.com";
  return [
    { url: base, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/services`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/services/virtual-number`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/services/rent-number`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services/shopping`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/services/flights`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services/gaming`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services/boost`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/services/data`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/services/airtime`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/services/electricity`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services/cable-tv`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/services/virtual-card`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/services/gift-card`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/profile/faqs`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/profile/privacy`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/profile/support`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
