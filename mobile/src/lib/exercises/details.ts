import type { BodyPart, ExerciseDetail } from "./types";

const cache = new Map<BodyPart, Record<string, ExerciseDetail>>();

function loadChunk(bodyPart: BodyPart): Record<string, ExerciseDetail> {
  const cached = cache.get(bodyPart);
  if (cached) return cached;
  const chunk = loadChunkUncached(bodyPart);
  cache.set(bodyPart, chunk);
  return chunk;
}

function loadChunkUncached(bodyPart: BodyPart): Record<string, ExerciseDetail> {
  switch (bodyPart) {
    case "ABS":
      return require("@/data/exercises/details/ABS.json") as Record<string, ExerciseDetail>;
    case "BACK":
      return require("@/data/exercises/details/BACK.json") as Record<string, ExerciseDetail>;
    case "BICEPS":
      return require("@/data/exercises/details/BICEPS.json") as Record<string, ExerciseDetail>;
    case "CHEST":
      return require("@/data/exercises/details/CHEST.json") as Record<string, ExerciseDetail>;
    case "FOREARMS":
      return require("@/data/exercises/details/FOREARMS.json") as Record<string, ExerciseDetail>;
    case "GLUTEUS":
      return require("@/data/exercises/details/GLUTEUS.json") as Record<string, ExerciseDetail>;
    case "LEGS":
      return require("@/data/exercises/details/LEGS.json") as Record<string, ExerciseDetail>;
    case "SHOULDERS":
      return require("@/data/exercises/details/SHOULDERS.json") as Record<string, ExerciseDetail>;
    case "TRICEPS":
      return require("@/data/exercises/details/TRICEPS.json") as Record<string, ExerciseDetail>;
  }
}

export function getExerciseDetail(id: string, bodyPart: BodyPart): ExerciseDetail | undefined {
  return loadChunk(bodyPart)[id];
}
