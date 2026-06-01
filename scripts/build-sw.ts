import { serwist } from "@serwist/next/config";
import type { InjectManifestOptions } from "@serwist/build";
import { rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

async function main() {
  const swSrc = path.join(root, "src/app/sw.ts");
  const swDest = path.join(root, "public/sw.js");
  const swBundle = path.join(root, ".next/sw.bundle.js");

  if (existsSync(swDest)) await rm(swDest, { force: true });
  if (existsSync(`${swDest}.map`)) await rm(`${swDest}.map`, { force: true });
  if (existsSync(swBundle)) await rm(swBundle, { force: true });

  await esbuild({
    entryPoints: [swSrc],
    bundle: true,
    format: "iife",
    target: ["es2020"],
    platform: "browser",
    minify: true,
    sourcemap: false,
    outfile: swBundle,
    logLevel: "silent",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  const buildOptions = await serwist(
    {
      swSrc: swBundle,
      swDest,
      globDirectory: root,
      cacheOnNavigation: true,
      reloadOnOnline: true,
      disable: false,
    },
    undefined,
    { cwd: root, isDev: process.env.NODE_ENV !== "production" }
  );

  const {
    cacheOnNavigation: _a,
    reloadOnOnline: _b,
    disable: _c,
    esbuildOptions: _d,
    ...buildOnly
  } = buildOptions as Record<string, unknown> & {
    cacheOnNavigation?: unknown;
    reloadOnOnline?: unknown;
    disable?: unknown;
    esbuildOptions?: unknown;
  };

  const { injectManifest } = await import("@serwist/build");
  const result = await injectManifest(buildOnly as unknown as InjectManifestOptions);

  await rm(swBundle, { force: true });

  console.log(
    `[build-sw] Wrote service worker (${result.count} precached entries, ${result.warnings.length} warnings)`
  );
  for (const w of result.warnings) console.warn(`[build-sw] ${w}`);
}

main().catch((err) => {
  console.error("[build-sw] Failed:", err);
  process.exit(1);
});
