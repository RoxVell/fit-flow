import { useSyncExternalStore } from "react";

import type { ProgramEntity } from "@/lib/db/types";
import type { ProgramInput } from "@/lib/repositories/programs";
import { generateId } from "@/lib/utils/id";
import { resolveRestDuration } from "@/lib/workout/rest-duration";

// Draft of the program being created/edited. Lives outside React so the
// create screen, the session editor and the exercise picker (separate routes
// in the same modal stack) share it. Reset by `startDraft` on every open.

export type DraftExercise = {
  id: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
};

export type DraftSession = {
  id: string;
  name: string;
  dayOfWeek: number;
  exercises: DraftExercise[];
};

export type ProgramDraft = {
  name: string;
  description: string;
  restDurationSeconds: number;
  sessions: DraftSession[];
};

type State = {
  editId: string | null;
  draft: ProgramDraft;
  initial: string;
};

function emptyDraft(): ProgramDraft {
  return { name: "", description: "", restDurationSeconds: resolveRestDuration(), sessions: [] };
}

function fromProgram(program: ProgramEntity): ProgramDraft {
  return {
    name: program.name,
    description: program.description,
    restDurationSeconds: resolveRestDuration(program.restDurationSeconds),
    sessions: program.sessions.map((s) => ({
      id: generateId(),
      name: s.name,
      dayOfWeek: s.dayOfWeek,
      exercises: s.exercises.map((e) => ({
        id: generateId(),
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
      })),
    })),
  };
}

let state: State = { editId: null, draft: emptyDraft(), initial: JSON.stringify(emptyDraft()) };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setDraft(update: (draft: ProgramDraft) => ProgramDraft) {
  state = { ...state, draft: update(state.draft) };
  emit();
}

function setSession(id: string, update: (session: DraftSession) => DraftSession) {
  setDraft((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === id ? update(s) : s)) }));
}

// Mirrors SwiftUI's `move(fromOffsets:toOffset:)`: `destination` is an index
// into the array before removal.
function moveItems<T>(items: T[], sources: number[], destination: number): T[] {
  const moving = sources.map((i) => items[i]);
  const remaining = items.filter((_, i) => !sources.includes(i));
  const insertAt = destination - sources.filter((i) => i < destination).length;
  remaining.splice(insertAt, 0, ...moving);
  return remaining;
}

export function startDraft(program: ProgramEntity | undefined) {
  const draft = program ? fromProgram(program) : emptyDraft();
  state = { editId: program?.id ?? null, draft, initial: JSON.stringify(draft) };
  // No emit: create.tsx calls this from a useState initializer. Notifying
  // here updates subscribers (including this screen) during render.
}

export function useProgramDraft(): State {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

export function updateDraft(patch: Partial<Omit<ProgramDraft, "sessions">>) {
  setDraft((d) => ({ ...d, ...patch }));
}

export function addSession(defaultName: (n: number) => string): string {
  const id = generateId();
  setDraft((d) => {
    const usedDays = new Set(d.sessions.map((s) => s.dayOfWeek));
    const nextDay = [1, 2, 3, 4, 5, 6, 0].find((day) => !usedDays.has(day)) ?? 1;
    return {
      ...d,
      sessions: [...d.sessions, { id, name: defaultName(d.sessions.length + 1), dayOfWeek: nextDay, exercises: [] }],
    };
  });
  return id;
}

export function updateSession(id: string, patch: Partial<Omit<DraftSession, "id" | "exercises">>) {
  setSession(id, (s) => ({ ...s, ...patch }));
}

export function removeSession(id: string) {
  setDraft((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
}

export function removeSessionsAt(indices: number[]) {
  setDraft((d) => ({ ...d, sessions: d.sessions.filter((_, i) => !indices.includes(i)) }));
}

export function addExercise(sessionId: string, exerciseId: string) {
  setSession(sessionId, (s) => ({
    ...s,
    exercises: [...s.exercises, { id: generateId(), exerciseId, targetSets: 3, targetReps: "" }],
  }));
}

export function updateExercise(sessionId: string, id: string, patch: Partial<Pick<DraftExercise, "targetSets" | "targetReps">>) {
  setSession(sessionId, (s) => ({
    ...s,
    exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
}

export function removeExercisesAt(sessionId: string, indices: number[]) {
  setSession(sessionId, (s) => ({ ...s, exercises: s.exercises.filter((_, i) => !indices.includes(i)) }));
}

export function moveExercises(sessionId: string, sources: number[], destination: number) {
  setSession(sessionId, (s) => ({ ...s, exercises: moveItems(s.exercises, sources, destination) }));
}

export function isDraftDirty(s: State): boolean {
  return JSON.stringify(s.draft) !== s.initial;
}

export function isSessionValid(session: DraftSession): boolean {
  return session.name.trim().length > 0 && session.exercises.length > 0;
}

export function canSaveDraft(draft: ProgramDraft): boolean {
  return draft.name.trim().length > 0 && draft.sessions.length > 0 && draft.sessions.every(isSessionValid);
}

export function toProgramInput(draft: ProgramDraft): ProgramInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    daysPerWeek: draft.sessions.length,
    restDurationSeconds: draft.restDurationSeconds,
    sessions: draft.sessions.map((s, i) => ({
      name: s.name.trim(),
      dayOfWeek: s.dayOfWeek,
      sortOrder: i,
      exercises: s.exercises.map((e, j) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps.trim(),
        sortOrder: j,
      })),
    })),
  };
}
