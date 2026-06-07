import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { ExerciseManifestItem } from "./types";

export const IMPORT_NOTE = "imported:boostcamp";
export const MAPPING_FILE = join(process.cwd(), "data", "boostcamp-exercise-map.json");
export const MANIFEST_FILE = join(process.cwd(), "public", "exercises", "manifest.json");

export function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i++;
  }
  return args;
}

export function requireCsvPath(args: Record<string, string | boolean>): string {
  const csv = args.csv;
  if (typeof csv !== "string" || !csv) {
    throw new Error("Missing required --csv <path> argument");
  }
  if (!existsSync(csv)) {
    throw new Error(`CSV file not found: ${csv}`);
  }
  return csv;
}

export function loadManifest(): ExerciseManifestItem[] {
  return JSON.parse(readFileSync(MANIFEST_FILE, "utf8")) as ExerciseManifestItem[];
}

export function manifestById(manifest: ExerciseManifestItem[]): Map<string, ExerciseManifestItem> {
  return new Map(manifest.map((item) => [item.id, item]));
}

export function manifestByName(manifest: ExerciseManifestItem[]): Map<string, ExerciseManifestItem> {
  return new Map(manifest.map((item) => [item.name.en, item]));
}
