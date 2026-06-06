import type {
  BodyPart,
  ExerciseDetail,
  ExerciseLibraryMeta,
  ExerciseManifestItem,
} from "./types";

const MANIFEST_URL = "/exercises/manifest.json";
const META_URL = "/exercises/meta.json";

let manifestPromise: Promise<ExerciseManifestItem[]> | null = null;
let metaPromise: Promise<ExerciseLibraryMeta> | null = null;
const detailCache = new Map<BodyPart, Promise<Record<string, ExerciseDetail>>>();

let cachedManifest: ExerciseManifestItem[] | null = null;
let manifestLoadError: Error | null = null;

const cacheClearListeners = new Set<() => void>();

export function getCachedManifest(): ExerciseManifestItem[] | null {
  return cachedManifest;
}

export function getManifestLoadError(): Error | null {
  return manifestLoadError;
}

export function setCachedManifest(data: ExerciseManifestItem[] | null): void {
  cachedManifest = data;
  if (data) manifestLoadError = null;
}

export function setManifestLoadError(err: Error | null): void {
  manifestLoadError = err;
}

export function subscribeExerciseLibraryCacheClear(
  listener: () => void
): () => void {
  cacheClearListeners.add(listener);
  return () => cacheClearListeners.delete(listener);
}

export function clearExerciseLibraryCache() {
  manifestPromise = null;
  metaPromise = null;
  detailCache.clear();
  cachedManifest = null;
  manifestLoadError = null;
  cacheClearListeners.forEach((listener) => listener());
}

export async function fetchManifest(): Promise<ExerciseManifestItem[]> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load exercise manifest");
        return r.json() as Promise<ExerciseManifestItem[]>;
      })
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

export async function fetchMeta(): Promise<ExerciseLibraryMeta> {
  if (!metaPromise) {
    metaPromise = fetch(META_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load exercise meta");
        return r.json() as Promise<ExerciseLibraryMeta>;
      })
      .catch((err) => {
        metaPromise = null;
        throw err;
      });
  }
  return metaPromise;
}

export async function fetchBodyPartDetails(
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
        detailCache.delete(bodyPart);
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

export async function ensureManifestLoaded(): Promise<ExerciseManifestItem[]> {
  const cached = getCachedManifest();
  if (cached) return cached;
  const data = await fetchManifest();
  setCachedManifest(data);
  return data;
}
