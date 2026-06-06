import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

type RawExercise = {
  id: string;
  bodyPart: string;
  translations: Record<string, string>;
  descriptions: Record<string, string>;
  instructions: Record<string, string[]>;
  tips: Record<string, string[]>;
  commonMistakes: Record<string, string[]>;
  equipments: string[];
  exerciseMuscles: Record<string, number>;
  laterality: string;
  mechanics: string;
  weightType: string;
  tags: string[];
  image?: { uri: string };
  thumbnail1?: { uri: string };
  thumbnail2?: { uri: string };
  videoDarkUrl: string;
  videoLightUrl: string;
};

type LocalizedString = { en: string; ru: string };
type LocalizedList = { en: string[]; ru: string[] };

type ManifestItem = {
  id: string;
  name: LocalizedString;
  bodyPart: string;
  equipments: string[];
  mechanics: string;
  laterality: string;
  weightType: string;
  tags: string[];
  thumbnailUri: string | null;
};

type ExerciseDetail = ManifestItem & {
  description: LocalizedString;
  instructions: LocalizedList;
  tips: LocalizedList;
  commonMistakes: LocalizedList;
  imageUri: string | null;
  thumbnail1Uri: string | null;
  thumbnail2Uri: string | null;
  videoDarkUrl: string;
  videoLightUrl: string;
  exerciseMuscles: Record<string, number>;
};

function uri(asset?: { uri: string }): string | null {
  return asset?.uri ?? null;
}

function mergeLocalizedString(
  enVal: string | undefined,
  ruVal: string | undefined
): LocalizedString {
  return {
    en: enVal ?? ruVal ?? "",
    ru: ruVal ?? enVal ?? "",
  };
}

function mergeLocalizedList(
  enVal: string[] | undefined,
  ruVal: string[] | undefined
): LocalizedList {
  return {
    en: enVal ?? ruVal ?? [],
    ru: ruVal ?? enVal ?? [],
  };
}

function loadExercises(path: string): RawExercise[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return raw.pageProps.exercises as RawExercise[];
}

function build() {
  const root = join(process.cwd());
  const enPath =
    process.env.EXERCISE_EN ??
    join(root, "data/raw/exercise-library.json");
  const ruPath =
    process.env.EXERCISE_RU ??
    join(root, "data/raw/biblioteka-uprazhneniy.json");
  const outDir = join(root, "public/exercises");
  const detailsDir = join(outDir, "details");

  const enExercises = loadExercises(enPath);
  const ruExercises = loadExercises(ruPath);
  const ruById = new Map(ruExercises.map((e) => [e.id, e]));

  const manifest: ManifestItem[] = [];
  const chunks: Record<string, Record<string, ExerciseDetail>> = {};

  for (const en of enExercises) {
    const ru = ruById.get(en.id);
    if (!ru) {
      console.warn(`Missing RU entry for ${en.id}`);
    }

    const name = mergeLocalizedString(
      en.translations.en,
      ru?.translations.ru
    );
    const description = mergeLocalizedString(
      en.descriptions.en,
      ru?.descriptions.ru
    );
    const instructions = mergeLocalizedList(
      en.instructions.en,
      ru?.instructions.ru
    );
    const tips = mergeLocalizedList(en.tips.en, ru?.tips.ru);
    const commonMistakes = mergeLocalizedList(
      en.commonMistakes.en,
      en.commonMistakes.ru ?? ru?.commonMistakes.ru
    );

    const thumbnailUri =
      uri(en.thumbnail1) ?? uri(en.thumbnail2) ?? uri(en.image);

    const item: ManifestItem = {
      id: en.id,
      name,
      bodyPart: en.bodyPart,
      equipments: en.equipments,
      mechanics: en.mechanics,
      laterality: en.laterality,
      weightType: en.weightType,
      tags: en.tags,
      thumbnailUri,
    };

    const detail: ExerciseDetail = {
      ...item,
      description,
      instructions,
      tips,
      commonMistakes,
      imageUri: uri(en.image),
      thumbnail1Uri: uri(en.thumbnail1),
      thumbnail2Uri: uri(en.thumbnail2),
      videoDarkUrl: en.videoDarkUrl,
      videoLightUrl: en.videoLightUrl,
      exerciseMuscles: en.exerciseMuscles,
    };

    manifest.push(item);
    if (!chunks[en.bodyPart]) chunks[en.bodyPart] = {};
    chunks[en.bodyPart][en.id] = detail;
  }

  manifest.sort((a, b) => a.name.en.localeCompare(b.name.en));

  mkdirSync(detailsDir, { recursive: true });
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest));
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify({
      version: 1,
      builtAt: new Date().toISOString(),
      count: manifest.length,
      bodyParts: Object.keys(chunks).sort(),
    })
  );

  for (const [bodyPart, records] of Object.entries(chunks)) {
    writeFileSync(
      join(detailsDir, `${bodyPart}.json`),
      JSON.stringify(records)
    );
  }

  console.log(
    `Built ${manifest.length} exercises into ${outDir} (${Object.keys(chunks).length} body-part chunks)`
  );
}

build();
