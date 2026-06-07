import { existsSync, readFileSync } from "fs";
import { readBoostcampCsv } from "./parse-csv";
import { transformBoostcampRows } from "./transform";
import type { BoostcampWorkoutLog, ExerciseMappingFile } from "./types";
import { IMPORT_NOTE, loadEnv, loadManifest, MAPPING_FILE, parseArgs, requireCsvPath } from "./utils";

function loadMapping(): ExerciseMappingFile {
  if (!existsSync(MAPPING_FILE)) {
    throw new Error(`Mapping file not found: ${MAPPING_FILE}. Run npm run boostcamp:map first.`);
  }
  return JSON.parse(readFileSync(MAPPING_FILE, "utf8")) as ExerciseMappingFile;
}

async function checkExistingImport(
  startedAtMin: Date,
  startedAtMax: Date,
  force: boolean
): Promise<void> {
  const { and, gte, isNull, like, lte } = await import("drizzle-orm");
  const { db } = await import("../../src/server/db/index");
  const { workoutLogs } = await import("../../src/server/db/schema");

  const imported = await db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(and(like(workoutLogs.notes, `${IMPORT_NOTE}%`), isNull(workoutLogs.deletedAt)));

  if (imported.length > 0 && !force) {
    throw new Error(
      `Found ${imported.length} existing Boostcamp import(s) (notes="${IMPORT_NOTE}"). ` +
        "Use --force to import anyway."
    );
  }

  const overlapping = await db
    .select({ id: workoutLogs.id, startedAt: workoutLogs.startedAt })
    .from(workoutLogs)
    .where(
      and(
        gte(workoutLogs.startedAt, startedAtMin),
        lte(workoutLogs.startedAt, startedAtMax),
        isNull(workoutLogs.deletedAt)
      )
    );

  if (overlapping.length > 0 && !force) {
    throw new Error(
      `Found ${overlapping.length} workout log(s) in the import date range. Use --force to import anyway.`
    );
  }
}

async function insertWorkoutLogs(logs: BoostcampWorkoutLog[]): Promise<void> {
  const { db } = await import("../../src/server/db/index");
  const { workoutLogs } = await import("../../src/server/db/schema");
  const now = new Date();

  await db.insert(workoutLogs).values(
    logs.map((log) => ({
      id: log.id,
      startedAt: new Date(log.startedAt),
      endedAt: new Date(log.endedAt),
      programId: null,
      sessionId: null,
      programName: log.programName,
      sessionName: log.sessionName,
      notes: log.notes,
      exercises: log.exercises,
      revision: log.revision,
      updatedAt: now,
      deletedAt: null,
    }))
  );
}

async function main(): Promise<void> {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const csvPath = requireCsvPath(args);
  const dryRun = Boolean(args["dry-run"]);
  const force = Boolean(args.force);

  if (!process.env.DATABASE_URL && !dryRun) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local or the environment.");
  }

  const rows = readBoostcampCsv(csvPath);
  const mapping = loadMapping();
  const manifest = loadManifest();
  const logs = transformBoostcampRows(rows, mapping, manifest);

  const dates = logs.map((log) => new Date(log.startedAt).getTime());
  const startedAtMin = new Date(Math.min(...dates));
  const startedAtMax = new Date(Math.max(...dates));

  const totalExercises = logs.reduce((sum, log) => sum + log.exercises.length, 0);
  const totalSets = logs.reduce(
    (sum, log) => sum + log.exercises.reduce((inner, exercise) => inner + exercise.sets.length, 0),
    0
  );
  const uniqueExercises = new Set(rows.map((row) => row.exercise)).size;
  const mappedExercises = Object.values(mapping).filter((entry) => entry.exerciseId).length;

  console.log("Boostcamp import preview");
  console.log("=".repeat(48));
  console.log(`CSV rows:          ${rows.length}`);
  console.log(`Workout sessions:  ${logs.length}`);
  console.log(`Unique exercises:  ${uniqueExercises}`);
  console.log(`Mapped exercises:  ${mappedExercises}`);
  console.log(`Logged exercises:  ${totalExercises}`);
  console.log(`Sets:              ${totalSets}`);
  console.log(
    `Date range:        ${startedAtMin.toISOString().slice(0, 10)} .. ${startedAtMax.toISOString().slice(0, 10)}`
  );
  console.log(`Mode:              ${dryRun ? "dry-run" : force ? "import (--force)" : "import"}`);

  if (dryRun) {
    console.log("\nDry run complete. No database changes were made.");
    return;
  }

  await checkExistingImport(startedAtMin, startedAtMax, force);
  await insertWorkoutLogs(logs);

  console.log(`\nImported ${logs.length} workout logs into Postgres.`);
  console.log("Open the app to sync history into IndexedDB.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
