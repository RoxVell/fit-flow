import { getMeta, idbBulkPut, setMeta, idbGetAll, idbClearAll } from "./idb";
import { exercises, programs } from "./seed";

const SEED_KEY = "fitflow.seeded";

declare global {
  // eslint-disable-next-line no-var
  var __fitflow_seed_promise__: Promise<void> | undefined;
}

function getSeedPromise(): Promise<void> {
  if (globalThis.__fitflow_seed_promise__) {
    return globalThis.__fitflow_seed_promise__;
  }
  const p = doSeed();
  globalThis.__fitflow_seed_promise__ = p;
  return p;
}

export async function ensureSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if ((await getMeta<boolean>(SEED_KEY)) === true) return;
  await getSeedPromise();
}

async function doSeed(): Promise<void> {
  if (typeof window === "undefined") return;
  const [existingExercises, existingPrograms] = await Promise.all([
    idbGetAll("exercises"),
    idbGetAll("programs"),
  ]);
  if (existingExercises.length === 0) {
    await idbBulkPut("exercises", exercises);
  }
  if (existingPrograms.length === 0) {
    await idbBulkPut("programs", programs);
  }
  await setMeta(SEED_KEY, true);
}

export async function resetAllData(): Promise<void> {
  await idbClearAll();
  delete globalThis.__fitflow_seed_promise__;
  await doSeed();
}
