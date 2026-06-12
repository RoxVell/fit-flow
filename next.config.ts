import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.0.23"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.smartworkout.app",
        pathname: "/asset/**",
      },
    ],
  },
};

/**
 * Disable the on-screen dev indicator in CI / test runs.
 *
 * The indicator renders at `bottom-left` by default — the same corner the
 * mobile-first bottom navigation lives in. During Playwright runs it
 * covers the first nav link and intercepts pointer events, breaking
 * tests that try to click it. Gating the option on `CI` keeps the
 * indicator visible for local development.
 */
const nextConfig = (phase: string, ctx: { defaultConfig: NextConfig }): NextConfig => {
  const isCi = process.env.CI === "true";
  return withSerwist({
    ...ctx.defaultConfig,
    ...baseConfig,
    devIndicators: isCi ? false : ctx.defaultConfig.devIndicators,
  });
};

export default nextConfig;
