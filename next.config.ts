import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Serwist PWA will be configured in Phase 10
// It requires webpack which is incompatible with Next.js 16 Turbopack default

export default nextConfig;
