import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import pkg from "./package.json";

const isE2eRun = process.env.CI === "true" || process.env.PWTEST === "1";

const config: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
  // The mobile navigation and Next dev indicator overlap in Playwright.
  ...(isE2eRun && { devIndicators: false }),
  logging: { browserToTerminal: false },
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

export default withSerwist(config);
