import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { muscleWeightsFromLibrary } from "../src/lib/exercises/muscle-map";
import type { BodyPart, ExerciseDetail, ExerciseLibraryMeta, ExerciseManifestItem } from "../src/lib/exercises/types";

type RawExercise = {
  id: string;
  bodyPart: ExerciseManifestItem["bodyPart"];
  translations: Record<string, string>;
  descriptions: Record<string, string>;
  instructions: Record<string, string[]>;
  tips: Record<string, string[]>;
  commonMistakes: Record<string, string[]>;
  equipments: string[];
  exerciseMuscles: Record<string, number>;
  laterality: ExerciseManifestItem["laterality"];
  mechanics: ExerciseManifestItem["mechanics"];
  weightType: string;
  tags: string[];
  image?: { uri: string };
  thumbnail1?: { uri: string };
  thumbnail2?: { uri: string };
  videoDarkUrl: string;
  videoLightUrl: string;
};

function uri(asset?: { uri: string }): string | null {
  return asset?.uri ?? null;
}

function localized<T>(en: T | undefined, ru: T | undefined, fallback: T) {
  return { en: en ?? ru ?? fallback, ru: ru ?? en ?? fallback };
}

function loadExercises(path: string): RawExercise[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return raw.pageProps.exercises as RawExercise[];
}

function build() {
  const root = process.cwd();
  const enPath =
    process.env.EXERCISE_EN ??
    join(root, "data/raw/exercise-library.json");
  const ruPath =
    process.env.EXERCISE_RU ??
    join(root, "data/raw/biblioteka-uprazhneniy.json");
  const outDir = join(root, "public/exercises");
  const detailsDir = join(outDir, "details");
  const manifestPath = join(outDir, "manifest.json");

  const hasSources = existsSync(enPath) && existsSync(ruPath);
  if (!hasSources) {
    if (existsSync(manifestPath)) {
      console.log(
        "Exercise source JSON not found (data/raw/ is local-only); using committed public/exercises/*.json"
      );
      return;
    }
    console.error(
      `Missing exercise sources:\n  ${enPath}\n  ${ruPath}\nAnd no committed manifest at ${manifestPath}`
    );
    process.exit(1);
  }

  const enExercises = loadExercises(enPath);
  const ruExercises = loadExercises(ruPath);
  const ruById = new Map(ruExercises.map((e) => [e.id, e]));

  const manifest: ExerciseManifestItem[] = [];
  const chunks = new Map<BodyPart, Record<string, ExerciseDetail>>();

  for (const en of enExercises) {
    const ru = ruById.get(en.id);
    if (!ru) {
      console.warn(`Missing RU entry for ${en.id}`);
    }

    const thumbnailUri =
      uri(en.thumbnail1) ?? uri(en.thumbnail2) ?? uri(en.image);

    const item: ExerciseManifestItem = {
      id: en.id,
      name: localized(en.translations.en, ru?.translations.ru, ""),
      bodyPart: en.bodyPart,
      equipments: en.equipments,
      mechanics: en.mechanics,
      laterality: en.laterality,
      weightType: en.weightType,
      tags: en.tags,
      thumbnailUri,
      muscleWeights: muscleWeightsFromLibrary(en.exerciseMuscles ?? {}),
    };

    const detail: ExerciseDetail = {
      ...item,
      description: localized(en.descriptions.en, ru?.descriptions.ru, ""),
      instructions: localized(en.instructions.en, ru?.instructions.ru, []),
      tips: localized(en.tips.en, ru?.tips.ru, []),
      commonMistakes: localized(en.commonMistakes.en, ru?.commonMistakes.ru, []),
      imageUri: uri(en.image),
      thumbnail1Uri: uri(en.thumbnail1),
      thumbnail2Uri: uri(en.thumbnail2),
      videoDarkUrl: en.videoDarkUrl,
      videoLightUrl: en.videoLightUrl,
      exerciseMuscles: en.exerciseMuscles,
    };

    manifest.push(item);
    const chunk = chunks.get(en.bodyPart) ?? {};
    chunk[en.id] = detail;
    chunks.set(en.bodyPart, chunk);
  }

  manifest.sort((a, b) => a.name.en.localeCompare(b.name.en));

  mkdirSync(detailsDir, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify({
      version: 1,
      builtAt: new Date().toISOString(),
      count: manifest.length,
      bodyParts: [...chunks.keys()].sort(),
    } satisfies ExerciseLibraryMeta)
  );

  for (const [bodyPart, records] of chunks) {
    writeFileSync(
      join(detailsDir, `${bodyPart}.json`),
      JSON.stringify(records)
    );
  }

  console.log(
    `Built ${manifest.length} exercises into ${outDir} (${chunks.size} body-part chunks)`
  );
}

build();
