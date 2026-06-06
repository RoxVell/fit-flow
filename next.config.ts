import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.0.15"],
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

export default withSerwist(nextConfig);
