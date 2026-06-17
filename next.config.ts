import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import pkg from "./package.json";

const NEXT_PUBLIC_APP_VERSION = pkg.version as string;
const NEXT_PUBLIC_BUILD_DATE = new Date().toISOString();

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
 * Disable the on-screen dev indicator during e2e test runs.
 *
 * The indicator renders at `bottom-left` by default — the same corner the
 * mobile-first bottom navigation lives in. During Playwright runs it
 * covers the first nav link and intercepts pointer events, breaking
 * tests that try to click it. We flip it off whenever the dev server was
 * started by Playwright (the `PWTEST=1` env var is injected by
 * `playwright.config.ts` → `webServer.env`) and in CI, leaving the
 * indicator visible for ordinary `npm run dev` usage.
 */
const nextConfig = (phase: string, ctx: { defaultConfig: NextConfig }): NextConfig => {
  const isE2eRun = process.env.CI === "true" || process.env.PWTEST === "1";
  // Next 16 prints a deprecation warning on every dev boot unless we
  // *explicitly* set the new top-level `logging.browserToTerminal`
  // (the old `experimental.browserDebugInfoInTerminal` key is gone).
  // We default to `false` (no browser logs in the terminal) which is
  // the same behaviour the old default produced.
  const config: NextConfig = {
    ...ctx.defaultConfig,
    ...baseConfig,
    env: {
      NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_BUILD_DATE,
    },
    devIndicators: isE2eRun ? false : ctx.defaultConfig.devIndicators,
    logging: {
      ...ctx.defaultConfig.logging,
      browserToTerminal: false,
    },
  };
  return withSerwist(config);
};

export default nextConfig;