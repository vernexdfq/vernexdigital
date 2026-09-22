import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent ESLint warnings (e.g. unused imports) from failing production builds on Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep type checking; only skip ESLint so deploys are not blocked by lint noise
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
