import type { WorkoutProgram } from "./types";
import { SEED_EXERCISES as E } from "./seed-exercise-ids";

/**
 * Reference data bootstrap.
 * Programs seeded into IDB on first read.
 * Exercise catalog is served from public/exercises/*.json.
 */

const now = new Date();
function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const programs: WorkoutProgram[] = [
  {
    id: "prog1",
    name: "PPL",
    description: "Push / Pull / Legs split — 6 days per week. Proven volume for intermediate lifters.",
    daysPerWeek: 6,
    isActive: true,
    restDurationSeconds: 90,
    createdAt: daysAgo(60),
    sessions: [
      {
        id: "sess1", name: "Push A", dayOfWeek: 1, programId: "prog1", sortOrder: 0,
        exercises: [
          { id: "se1", exerciseId: E.barbellBenchPress, sessionId: "sess1", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se2", exerciseId: E.inclineBarbellBenchPress, sessionId: "sess1", sortOrder: 1, targetSets: 3, targetReps: "8-12" },
          { id: "se3", exerciseId: E.overheadPress, sessionId: "sess1", sortOrder: 2, targetSets: 3, targetReps: "6-10" },
          { id: "se4", exerciseId: E.lateralRaise, sessionId: "sess1", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
          { id: "se5", exerciseId: E.skullCrusher, sessionId: "sess1", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess2", name: "Pull A", dayOfWeek: 2, programId: "prog1", sortOrder: 1,
        exercises: [
          { id: "se6", exerciseId: E.deadlift, sessionId: "sess2", sortOrder: 0, targetSets: 3, targetReps: "3-6" },
          { id: "se7", exerciseId: E.barbellRow, sessionId: "sess2", sortOrder: 1, targetSets: 4, targetReps: "6-10" },
          { id: "se8", exerciseId: E.pullUp, sessionId: "sess2", sortOrder: 2, targetSets: 4, targetReps: "6-10" },
          { id: "se9", exerciseId: E.facePull, sessionId: "sess2", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
          { id: "se10", exerciseId: E.barbellCurl, sessionId: "sess2", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess3", name: "Legs A", dayOfWeek: 3, programId: "prog1", sortOrder: 2,
        exercises: [
          { id: "se11", exerciseId: E.barbellSquat, sessionId: "sess3", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se12", exerciseId: E.romanianDeadlift, sessionId: "sess3", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se13", exerciseId: E.legPress, sessionId: "sess3", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se14", exerciseId: E.calfRaise, sessionId: "sess3", sortOrder: 3, targetSets: 4, targetReps: "12-15" },
          { id: "se15", exerciseId: E.plank, sessionId: "sess3", sortOrder: 4, targetSets: 3, targetReps: "45s" },
        ],
      },
      {
        id: "sess4", name: "Push B", dayOfWeek: 4, programId: "prog1", sortOrder: 3,
        exercises: [
          { id: "se16", exerciseId: E.dumbbellBenchPress, sessionId: "sess4", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se17", exerciseId: E.cableFly, sessionId: "sess4", sortOrder: 1, targetSets: 3, targetReps: "12-15" },
          { id: "se18", exerciseId: E.dumbbellShoulderPress, sessionId: "sess4", sortOrder: 2, targetSets: 3, targetReps: "8-12" },
          { id: "se19", exerciseId: E.tricepsPushdown, sessionId: "sess4", sortOrder: 3, targetSets: 3, targetReps: "10-15" },
        ],
      },
      {
        id: "sess5", name: "Pull B", dayOfWeek: 5, programId: "prog1", sortOrder: 4,
        exercises: [
          { id: "se20", exerciseId: E.seatedCableRow, sessionId: "sess5", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se21", exerciseId: E.latPulldown, sessionId: "sess5", sortOrder: 1, targetSets: 4, targetReps: "10-12" },
          { id: "se22", exerciseId: E.dumbbellRow, sessionId: "sess5", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se23", exerciseId: E.hammerCurl, sessionId: "sess5", sortOrder: 3, targetSets: 3, targetReps: "10-12" },
          { id: "se24", exerciseId: E.cableCrunch, sessionId: "sess5", sortOrder: 4, targetSets: 3, targetReps: "12-15" },
        ],
      },
      {
        id: "sess6", name: "Legs B", dayOfWeek: 6, programId: "prog1", sortOrder: 5,
        exercises: [
          { id: "se25", exerciseId: E.hipThrust, sessionId: "sess6", sortOrder: 0, targetSets: 4, targetReps: "6-10" },
          { id: "se26", exerciseId: E.bulgarianSquat, sessionId: "sess6", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se27", exerciseId: E.legCurl, sessionId: "sess6", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se28", exerciseId: E.hangingLegRaise, sessionId: "sess6", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
        ],
      },
    ],
  },
  {
    id: "prog2",
    name: "Upper / Lower",
    description: "Classic 4-day upper/lower split. Balanced volume for strength and hypertrophy.",
    daysPerWeek: 4,
    isActive: false,
    restDurationSeconds: 90,
    createdAt: daysAgo(30),
    sessions: [
      {
        id: "sess7", name: "Upper A", dayOfWeek: 1, programId: "prog2", sortOrder: 0,
        exercises: [
          { id: "se29", exerciseId: E.barbellBenchPress, sessionId: "sess7", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se30", exerciseId: E.barbellRow, sessionId: "sess7", sortOrder: 1, targetSets: 4, targetReps: "6-10" },
          { id: "se31", exerciseId: E.overheadPress, sessionId: "sess7", sortOrder: 2, targetSets: 3, targetReps: "6-10" },
          { id: "se32", exerciseId: E.latPulldown, sessionId: "sess7", sortOrder: 3, targetSets: 3, targetReps: "10-12" },
          { id: "se33", exerciseId: E.barbellCurl, sessionId: "sess7", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
          { id: "se34", exerciseId: E.tricepsPushdown, sessionId: "sess7", sortOrder: 5, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess8", name: "Lower A", dayOfWeek: 2, programId: "prog2", sortOrder: 1,
        exercises: [
          { id: "se35", exerciseId: E.barbellSquat, sessionId: "sess8", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se36", exerciseId: E.romanianDeadlift, sessionId: "sess8", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se37", exerciseId: E.legPress, sessionId: "sess8", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se40", exerciseId: E.calfRaise, sessionId: "sess8", sortOrder: 3, targetSets: 4, targetReps: "15-20" },
          { id: "se41", exerciseId: E.plank, sessionId: "sess8", sortOrder: 4, targetSets: 3, targetReps: "60s" },
        ],
      },
      {
        id: "sess9", name: "Upper B", dayOfWeek: 3, programId: "prog2", sortOrder: 2,
        exercises: [
          { id: "se42", exerciseId: E.dumbbellBenchPress, sessionId: "sess9", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se43", exerciseId: E.latPulldown, sessionId: "sess9", sortOrder: 1, targetSets: 4, targetReps: "10-12" },
          { id: "se44", exerciseId: E.lateralRaise, sessionId: "sess9", sortOrder: 2, targetSets: 3, targetReps: "15-20" },
          { id: "se45", exerciseId: E.skullCrusher, sessionId: "sess9", sortOrder: 3, targetSets: 3, targetReps: "10-15" },
          { id: "se46", exerciseId: E.cableCrunch, sessionId: "sess9", sortOrder: 4, targetSets: 3, targetReps: "15" },
        ],
      },
      {
        id: "sess10", name: "Lower B", dayOfWeek: 4, programId: "prog2", sortOrder: 3,
        exercises: [
          { id: "se47", exerciseId: E.deadlift, sessionId: "sess10", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se48", exerciseId: E.hipThrust, sessionId: "sess10", sortOrder: 1, targetSets: 3, targetReps: "10-15" },
          { id: "se49", exerciseId: E.bulgarianSquat, sessionId: "sess10", sortOrder: 2, targetSets: 3, targetReps: "8-12" },
          { id: "se50", exerciseId: E.hangingLegRaise, sessionId: "sess10", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
        ],
      },
    ],
  },
];
