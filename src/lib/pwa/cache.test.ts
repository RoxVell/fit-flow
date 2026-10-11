import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "./cache";

const MAIN_DIR = path.resolve(__dirname, "../../app/(main)");

function collectPageRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      routes.push(...collectPageRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`));
    } else if (entry.name === "page.tsx") {
      routes.push(prefix);
    }
  }
  return routes;
}

describe("APP_ROUTES", () => {
  it("lists every page under src/app/(main) so the service worker precaches it", () => {
    const pages = collectPageRoutes(MAIN_DIR).sort();
    expect([...APP_ROUTES].sort()).toEqual(pages);
  });
});
