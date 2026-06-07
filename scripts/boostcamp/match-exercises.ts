import type { ExerciseManifestItem, ExerciseMappingEntry, MappingConfidence } from "./types";

const KNOWN_OVERRIDES: Record<string, string> = {
  "Lat Pulldown": "Cable Lat Pulldown",
  "Leg Extension": "Seated Leg Extension Machine",
  "Seated Hamstring Curl": "Seated Leg Curl",
  "Seated Row (Machine)": "Chest Supported Machine Row",
  "Abs Crunch (Machine)": "Seated Ab Cable Crunch",
  "Hack Squat": "Machine Hack Squat",
  "Belt Squat": "Machine Belt Squat",
  "Hip Abductor (Machine)": "Seated Hip Abduction",
  "Hip Adductor (Machine)": "Seated Hip Adduction",
  "Dip (Weighted)": "Weighted Bench Dips",
  "Incline Bench Press (Barbell)": "Incline Barbell Bench Press",
  "Incline Bench Press (Dumbbell)": "Incline Dumbbell Bench Press",
  "Incline Bench Press (Smith Machine)": "Smith Incline Chest Press",
  "One Arm Lateral Raise (Cable)": "One-Arm Cable Lateral Raise",
  "Overhead Press (Dumbbell)": "Seated Dumbbell Shoulder Press",
  "Overhead Tricep Extension (Cable)": "Cable Overhead Triceps Extension",
  "Pec Deck (Machine)": "Pec Deck Chest Fly",
  "Rear Delt Fly (Cable)": "Cable Rear Delt Fly (Reverse Fly)",
  "Reverse Pec Deck": "Machine Reverse Flyes",
  "T-Bar Row": "T-Bar Bent Over Row",
  "Tricep Kickback": "Cable Double-Arm Tricep Kickback",
  "Tricep Pushdown (Cable)": "Cable Triceps Pushdown",
  "Cable Crunch": "Seated Ab Cable Crunch",
  "Calf Raise (Machine)": "Machine Calf Raises",
  "Calf Raise (Leg Press)": "Calf Leg Press",
  "Leg Press (45 Degrees)": "Leg Press",
  "Bicep Curl (Machine)": "Machine Biceps Curl",
  "Chest Supported Row (Dumbbell)": "Wide Grip Chest Supported Row",
  "Incline Curl (Dumbbell)": "Dumbbell Incline Hammer Curl",
  "Partial Calf Raise": "Machine Calf Raises",
  "Standing Pullover (Cable)": "Dumbbell Lat Pullover",
  "Wrist Curls": "Barbell Wrist Curl",
  "Reverse Bicep Curl (EZ Bar)": "EZ-Bar Reverse Grip Biceps Curl",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseBoostcampName(name: string): { base: string; equip: string | null } {
  const match = name.match(/^(.+?)\s*\((.+)\)$/);
  if (!match) return { base: name, equip: null };
  return { base: match[1].trim(), equip: match[2].trim() };
}

function reorderVariants(name: string): string[] {
  const parsed = parseBoostcampName(name);
  if (!parsed.equip) return [name];
  return [`${parsed.equip} ${parsed.base}`, `${parsed.base} ${parsed.equip}`, name];
}

function equipmentScore(equip: string, exercise: ExerciseManifestItem): number {
  const equipLower = equip.toLowerCase();
  const nameLower = exercise.name.en.toLowerCase();
  let score = 0;

  if (nameLower.includes(equipLower)) score += 40;
  if (equipLower.includes("machine") && exercise.equipments.includes("MACHINE")) score += 25;
  if (equipLower.includes("barbell") && exercise.equipments.includes("BARBELL")) score += 25;
  if (equipLower.includes("dumbbell") && exercise.equipments.includes("DUMBBELL")) score += 25;
  if (equipLower.includes("cable") && exercise.equipments.includes("CABLE")) score += 25;
  if (equipLower.includes("smith") && nameLower.includes("smith")) score += 25;
  if (equipLower.includes("ez bar") && nameLower.includes("ez")) score += 25;

  return score;
}

function scoreCandidate(boostcampName: string, exercise: ExerciseManifestItem): number {
  const parsed = parseBoostcampName(boostcampName);
  const en = exercise.name.en;
  const enNorm = normalize(en);
  const baseNorm = normalize(parsed.base);
  let score = 0;

  if (en.toLowerCase() === boostcampName.toLowerCase()) score += 100;
  if (enNorm === normalize(`${parsed.equip ?? ""}${parsed.base}`)) score += 50;
  if (enNorm.includes(baseNorm) || baseNorm.includes(enNorm)) score += 30;
  if (parsed.equip) score += equipmentScore(parsed.equip, exercise);

  return score;
}

function rankCandidates(
  boostcampName: string,
  manifest: ExerciseManifestItem[]
): ExerciseManifestItem[] {
  return manifest
    .map((exercise) => ({ exercise, score: scoreCandidate(boostcampName, exercise) }))
    .filter((entry) => entry.score >= 40)
    .sort((a, b) => b.score - a.score || a.exercise.name.en.localeCompare(b.exercise.name.en))
    .map((entry) => entry.exercise);
}

function findByEnglishName(
  manifest: ExerciseManifestItem[],
  englishName: string
): ExerciseManifestItem | undefined {
  return manifest.find((item) => item.name.en === englishName);
}

function confidenceFromMatch(
  boostcampName: string,
  exercise: ExerciseManifestItem,
  candidates: ExerciseManifestItem[]
): MappingConfidence {
  if (KNOWN_OVERRIDES[boostcampName]) return "medium";
  if (boostcampName.toLowerCase() === exercise.name.en.toLowerCase()) return "high";

  const variants = reorderVariants(boostcampName);
  if (variants.some((variant) => variant.toLowerCase() === exercise.name.en.toLowerCase())) {
    return "high";
  }

  if (candidates.length > 1 && candidates[0]?.id === exercise.id) {
    const secondScore = scoreCandidate(boostcampName, candidates[1]);
    const firstScore = scoreCandidate(boostcampName, candidates[0]);
    if (firstScore - secondScore < 15) return "manual";
    return "medium";
  }

  return "medium";
}

export function suggestExerciseMapping(
  boostcampName: string,
  manifest: ExerciseManifestItem[]
): ExerciseMappingEntry {
  const overrideName = KNOWN_OVERRIDES[boostcampName];
  if (overrideName) {
    const overrideExercise = findByEnglishName(manifest, overrideName);
    const candidates = rankCandidates(boostcampName, manifest).slice(0, 5);
    const alternatives = [
      ...new Set([
        overrideName,
        ...candidates.map((item) => item.name.en),
      ]),
    ].filter((name) => name !== overrideName);

    if (overrideExercise) {
      return {
        exerciseId: overrideExercise.id,
        matchedName: overrideExercise.name.en,
        confidence: "medium",
        alternatives,
      };
    }

    return {
      exerciseId: null,
      matchedName: null,
      confidence: "manual",
      alternatives: [overrideName, ...alternatives],
    };
  }

  for (const variant of reorderVariants(boostcampName)) {
    const exact = findByEnglishName(manifest, variant);
    if (exact) {
      const candidates = rankCandidates(boostcampName, manifest).slice(0, 5);
      return {
        exerciseId: exact.id,
        matchedName: exact.name.en,
        confidence: confidenceFromMatch(boostcampName, exact, candidates),
        alternatives: candidates
          .map((item) => item.name.en)
          .filter((name) => name !== exact.name.en)
          .slice(0, 4),
      };
    }
  }

  const candidates = rankCandidates(boostcampName, manifest);
  if (candidates.length === 0) {
    return {
      exerciseId: null,
      matchedName: null,
      confidence: "manual",
      alternatives: [],
    };
  }

  const best = candidates[0];
  return {
    exerciseId: best.id,
    matchedName: best.name.en,
    confidence: confidenceFromMatch(boostcampName, best, candidates),
    alternatives: candidates.slice(1, 5).map((item) => item.name.en),
  };
}

export function buildExerciseMapping(
  boostcampNames: string[],
  manifest: ExerciseManifestItem[],
  existing?: Record<string, ExerciseMappingEntry>
): Record<string, ExerciseMappingEntry> {
  const mapping: Record<string, ExerciseMappingEntry> = {};

  for (const name of boostcampNames) {
    const previous = existing?.[name];
    const suggestion = suggestExerciseMapping(name, manifest);

    if (previous?.exerciseId) {
      const preserved = manifest.find((item) => item.id === previous.exerciseId);
      mapping[name] = {
        exerciseId: previous.exerciseId,
        matchedName: preserved?.name.en ?? previous.matchedName,
        confidence: previous.confidence,
        alternatives: suggestion.alternatives,
      };
      continue;
    }

    mapping[name] = suggestion;
  }

  return mapping;
}

export function validateMapping(
  mapping: Record<string, ExerciseMappingEntry>,
  manifest: ExerciseManifestItem[],
  usedExerciseNames: string[]
): string[] {
  const errors: string[] = [];
  const ids = new Set(manifest.map((item) => item.id));

  for (const name of usedExerciseNames) {
    const entry = mapping[name];
    if (!entry) {
      errors.push(`Missing mapping for "${name}"`);
      continue;
    }
    if (!entry.exerciseId) {
      errors.push(`Unmapped exercise "${name}"`);
      continue;
    }
    if (!ids.has(entry.exerciseId)) {
      errors.push(`Unknown exerciseId for "${name}": ${entry.exerciseId}`);
    }
  }

  return errors;
}
