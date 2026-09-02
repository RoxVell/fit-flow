import { createSerwistRoute } from "@serwist/turbopack";
import { APP_ROUTES } from "@/lib/pwa/cache";

// Page HTML lives outside `.next/static`, so it is added to the precache
// manifest by URL. The revision changes per build (see next.config.ts),
// which makes every new service worker refetch all pages at install.
const revision = process.env.NEXT_PUBLIC_BUILD_DATE ?? null;

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
    additionalPrecacheEntries: APP_ROUTES.map((url) => ({ url, revision })),
  });
