import type {
  BodyPart,
  ExerciseDetail,
  ExerciseManifestItem,
} from "./types";

const MANIFEST_URL = "/exercises/manifest.json";

let manifestPromise: Promise<ExerciseManifestItem[]> | null = null;
const detailCache = new Map<BodyPart, Promise<Record<string, ExerciseDetail>>>();

let cachedManifest: ExerciseManifestItem[] | null = null;

const cacheClearListeners = new Set<() => void>();

export function getCachedManifest(): ExerciseManifestItem[] | null {
  return cachedManifest;
}

export function subscribeExerciseLibraryCacheClear(
  listener: () => void
): () => void {
  cacheClearListeners.add(listener);
  return () => cacheClearListeners.delete(listener);
}

export function clearExerciseLibraryCache() {
  manifestPromise = null;
  detailCache.clear();
  cachedManifest = null;
  cacheClearListeners.forEach((listener) => listener());
}

export function ensureManifestLoaded(): Promise<ExerciseManifestItem[]> {
  if (manifestPromise) return manifestPromise;
  const request = fetch(MANIFEST_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load exercise manifest");
      return r.json() as Promise<ExerciseManifestItem[]>;
    })
    .then((manifest) => {
      if (manifestPromise === request) cachedManifest = manifest;
      return manifest;
    })
    .catch((err) => {
      if (manifestPromise === request) manifestPromise = null;
      throw err;
    });
  manifestPromise = request;
  return request;
}

async function fetchBodyPartDetails(
  bodyPart: BodyPart
): Promise<Record<string, ExerciseDetail>> {
  let promise = detailCache.get(bodyPart);
  if (!promise) {
    promise = fetch(`/exercises/details/${bodyPart}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${bodyPart} exercises`);
        return r.json() as Promise<Record<string, ExerciseDetail>>;
      })
      .catch((err) => {
        if (detailCache.get(bodyPart) === promise) detailCache.delete(bodyPart);
        throw err;
      });
    detailCache.set(bodyPart, promise);
  }
  return promise;
}

export async function fetchExerciseDetail(
  id: string,
  bodyPart: BodyPart
): Promise<ExerciseDetail | undefined> {
  const chunk = await fetchBodyPartDetails(bodyPart);
  return chunk[id];
}
