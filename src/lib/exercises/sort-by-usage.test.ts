import { expect, it } from "vitest";
import type { ExerciseManifestItem } from "./types";
import { sortExercisesByUsage } from "./sort-by-usage";

function exercise(id: string, name: string): ExerciseManifestItem {
  return {
    id, name: { en: name, ru: name }, bodyPart: "CHEST", equipments: [],
    mechanics: "COMPOUND", laterality: "BILATERAL", weightType: "WEIGHT",
    tags: [], thumbnailUri: null,
  };
}

it("ranks remembered replacements before frequently used exercises, including in search results", () => {
  const items = [exercise("frequent", "A"), exercise("older", "B"), exercise("latest", "Z")];
  const usage = new Map([["frequent", 100], ["older", 10]]);
  expect(sortExercisesByUsage(items, usage, "en", ["latest", "older"]).map((e) => e.id))
    .toEqual(["latest", "older", "frequent"]);
  expect(sortExercisesByUsage(items, usage, "en").map((e) => e.id))
    .toEqual(["frequent", "older", "latest"]);
});
