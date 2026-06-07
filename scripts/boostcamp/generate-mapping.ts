import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getUniqueExerciseNames, readBoostcampCsv } from "./parse-csv";
import { buildExerciseMapping } from "./match-exercises";
import type { ExerciseMappingFile } from "./types";
import { loadManifest, MAPPING_FILE, parseArgs, requireCsvPath } from "./utils";

function loadExistingMapping(): ExerciseMappingFile | undefined {
  if (!existsSync(MAPPING_FILE)) return undefined;
  return JSON.parse(readFileSync(MAPPING_FILE, "utf8")) as ExerciseMappingFile;
}

function printSummary(mapping: ExerciseMappingFile): void {
  const entries = Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b));
  const unmapped = entries.filter(([, entry]) => !entry.exerciseId);
  const manual = entries.filter(([, entry]) => entry.confidence === "manual" || entry.confidence === "medium");

  console.log("\nExercise mapping summary");
  console.log("=".repeat(72));
  for (const [name, entry] of entries) {
    const status = entry.exerciseId ? entry.confidence.toUpperCase() : "UNMAPPED";
    const target = entry.matchedName ?? "(none)";
    console.log(`${status.padEnd(8)} ${name}`);
    console.log(`         -> ${target}`);
    if (entry.alternatives.length > 0) {
      console.log(`         alt: ${entry.alternatives.slice(0, 3).join(" | ")}`);
    }
  }

  console.log("=".repeat(72));
  console.log(`Total: ${entries.length}, unmapped: ${unmapped.length}, review suggested: ${manual.length}`);

  if (unmapped.length > 0) {
    console.log("\nFix unmapped exercises in data/boostcamp-exercise-map.json before importing.");
    process.exitCode = 1;
  } else if (manual.length > 0) {
    console.log("\nReview medium/manual mappings in data/boostcamp-exercise-map.json if needed.");
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = requireCsvPath(args);
  const rows = readBoostcampCsv(csvPath);
  const manifest = loadManifest();
  const existing = loadExistingMapping();
  const names = getUniqueExerciseNames(rows);
  const mapping = buildExerciseMapping(names, manifest, existing);

  mkdirSync(dirname(MAPPING_FILE), { recursive: true });
  writeFileSync(MAPPING_FILE, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");

  console.log(`Wrote ${Object.keys(mapping).length} mappings to ${MAPPING_FILE}`);
  printSummary(mapping);
}

main();
