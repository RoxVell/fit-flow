import type { Exercise, WorkoutProgram } from "./types";

/**
 * Reference data bootstrap.
 * TODO: when the real backend is wired up, delete this file and switch the
 * client transport to HTTP (see `src/lib/api/client.ts` and `setTransport`).
 * Exercises and programs will be fetched from `GET /api/exercises` and
 * `GET /api/programs`, then cached in IDB by the Serwist worker.
 */

export const exercises: Exercise[] = [
  { id: "ex1", name: "Barbell Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", unilateral: false, category: "compound", description: "Lie on a flat bench, lower the bar to your chest, then press up." },
  { id: "ex2", name: "Dumbbell Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell", unilateral: false, category: "compound", description: "Similar to barbell bench press but with dumbbells for greater ROM." },
  { id: "ex3", name: "Incline Barbell Bench Press", muscleGroup: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "barbell", unilateral: false, category: "compound", description: "Bench press on an incline bench to target upper chest." },
  { id: "ex4", name: "Cable Flyes", muscleGroup: "chest", secondaryMuscles: ["shoulders"], equipment: "cable", unilateral: false, category: "isolation", description: "Stand between cables, bring hands together in front of chest." },
  { id: "ex5", name: "Dumbbell Flyes", muscleGroup: "chest", secondaryMuscles: ["shoulders"], equipment: "dumbbell", unilateral: false, category: "isolation", description: "Lie on a flat bench, open arms wide and bring together." },
  { id: "ex6", name: "Pull-Ups", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", unilateral: false, category: "compound", description: "Hang from a bar and pull yourself up until your chin clears the bar." },
  { id: "ex7", name: "Barbell Row", muscleGroup: "back", secondaryMuscles: ["biceps", "traps"], equipment: "barbell", unilateral: false, category: "compound", description: "Bend at hips, pull barbell to your lower ribcage." },
  { id: "ex8", name: "Lat Pulldown", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "cable", unilateral: false, category: "compound", description: "Pull the bar down to your upper chest while seated." },
  { id: "ex9", name: "Seated Cable Row", muscleGroup: "back", secondaryMuscles: ["biceps", "traps"], equipment: "cable", unilateral: false, category: "compound", description: "Sit with legs braced, pull the handle to your stomach." },
  { id: "ex10", name: "Dumbbell Row", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", unilateral: true, category: "compound", description: "One knee on bench, row dumbbell to hip." },
  { id: "ex11", name: "Face Pull", muscleGroup: "shoulders", secondaryMuscles: ["traps", "back"], equipment: "cable", unilateral: false, category: "isolation", description: "Pull cable rope attachment toward your face, elbows high." },
  { id: "ex12", name: "Overhead Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell", unilateral: false, category: "compound", description: "Press the bar overhead from shoulder height." },
  { id: "ex13", name: "Lateral Raise", muscleGroup: "shoulders", secondaryMuscles: ["traps"], equipment: "dumbbell", unilateral: false, category: "isolation", description: "Raise dumbbells out to sides until parallel to floor." },
  { id: "ex14", name: "Front Raise", muscleGroup: "shoulders", secondaryMuscles: ["chest"], equipment: "dumbbell", unilateral: false, category: "isolation", description: "Raise dumbbells in front of you to shoulder height." },
  { id: "ex15", name: "Barbell Curl", muscleGroup: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", unilateral: false, category: "isolation", description: "Stand and curl the barbell toward your shoulders." },
  { id: "ex16", name: "Dumbbell Hammer Curl", muscleGroup: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", unilateral: false, category: "isolation", description: "Curl dumbbells with palms facing each other." },
  { id: "ex17", name: "Triceps Pushdown", muscleGroup: "triceps", secondaryMuscles: [], equipment: "cable", unilateral: false, category: "isolation", description: "Push the cable bar down until arms are straight." },
  { id: "ex18", name: "Skull Crushers", muscleGroup: "triceps", secondaryMuscles: ["chest"], equipment: "ez_bar", unilateral: false, category: "isolation", description: "Lie on bench, lower bar toward forehead, extend." },
  { id: "ex19", name: "Squat", muscleGroup: "quads", secondaryMuscles: ["glutes", "hamstrings", "calves"], equipment: "barbell", unilateral: false, category: "compound", description: "Barbell on back, squat down to parallel, stand up." },
  { id: "ex20", name: "Leg Press", muscleGroup: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "machine", unilateral: false, category: "compound", description: "Seated, press the platform away with your feet." },
  { id: "ex21", name: "Bulgarian Split Squat", muscleGroup: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell", unilateral: true, category: "compound", description: "Rear foot elevated on bench, front leg squats down." },
  { id: "ex22", name: "Romanian Deadlift", muscleGroup: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", unilateral: false, category: "compound", description: "Hinge at hips, lower barbell along legs, feel the stretch." },
  { id: "ex23", name: "Leg Curl", muscleGroup: "hamstrings", secondaryMuscles: ["calves"], equipment: "machine", unilateral: false, category: "isolation", description: "Seated or lying, curl the pad toward your glutes." },
  { id: "ex24", name: "Hip Thrust", muscleGroup: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", unilateral: false, category: "compound", description: "Shoulders on bench, barbell across hips, thrust upward." },
  { id: "ex25", name: "Standing Calf Raise", muscleGroup: "calves", secondaryMuscles: [], equipment: "machine", unilateral: false, category: "isolation", description: "Stand on the platform, rise up on toes, lower slowly." },
  { id: "ex26", name: "Deadlift", muscleGroup: "back", secondaryMuscles: ["glutes", "hamstrings", "traps"], equipment: "barbell", unilateral: false, category: "compound", description: "Pull the bar off the floor, stand tall." },
  { id: "ex27", name: "Plank", muscleGroup: "abs", secondaryMuscles: ["shoulders"], equipment: "bodyweight", unilateral: false, category: "isolation", description: "Hold a push-up position, core tight, body in a straight line." },
  { id: "ex28", name: "Hanging Leg Raise", muscleGroup: "abs", secondaryMuscles: ["hip_flexors"], equipment: "bodyweight", unilateral: false, category: "isolation", description: "Hang from a bar, raise your legs to parallel or higher." },
  { id: "ex29", name: "Cable Crunch", muscleGroup: "abs", secondaryMuscles: [], equipment: "cable", unilateral: false, category: "isolation", description: "Kneel facing away from cable, crunch down, contract abs." },
  { id: "ex30", name: "Dumbbell Shoulder Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", unilateral: false, category: "compound", description: "Seated or standing, press dumbbells overhead." },
  { id: "ex31", name: "Dips", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "bodyweight", unilateral: false, category: "compound", description: "On parallel bars, lower yourself, press back up." },
  { id: "ex32", name: "Dumbbell Lateral Raise", muscleGroup: "shoulders", secondaryMuscles: ["traps"], equipment: "dumbbell", unilateral: false, category: "isolation", description: "Lean slightly forward, raise dumbbells out and back." },
  { id: "ex33", name: "Goblet Squat", muscleGroup: "quads", secondaryMuscles: ["glutes", "abs"], equipment: "kettlebell", unilateral: false, category: "compound", description: "Hold a kettlebell at chest, squat down, elbows between knees." },
  { id: "ex34", name: "Farmers Walk", muscleGroup: "forearms", secondaryMuscles: ["traps", "abs"], equipment: "dumbbell", unilateral: false, category: "compound", description: "Pick up heavy dumbbells and walk for distance." },
  { id: "ex35", name: "Kettlebell Swing", muscleGroup: "glutes", secondaryMuscles: ["hamstrings", "back", "shoulders"], equipment: "kettlebell", unilateral: false, category: "compound", description: "Hinge at hips, swing kettlebell to chest height." },
];

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
    createdAt: daysAgo(60),
    sessions: [
      {
        id: "sess1", name: "Push A", dayOfWeek: 1, programId: "prog1", sortOrder: 0,
        exercises: [
          { id: "se1", exerciseId: "ex1", sessionId: "sess1", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se2", exerciseId: "ex3", sessionId: "sess1", sortOrder: 1, targetSets: 3, targetReps: "8-12" },
          { id: "se3", exerciseId: "ex12", sessionId: "sess1", sortOrder: 2, targetSets: 3, targetReps: "6-10" },
          { id: "se4", exerciseId: "ex13", sessionId: "sess1", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
          { id: "se5", exerciseId: "ex18", sessionId: "sess1", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess2", name: "Pull A", dayOfWeek: 2, programId: "prog1", sortOrder: 1,
        exercises: [
          { id: "se6", exerciseId: "ex26", sessionId: "sess2", sortOrder: 0, targetSets: 3, targetReps: "3-6" },
          { id: "se7", exerciseId: "ex7", sessionId: "sess2", sortOrder: 1, targetSets: 4, targetReps: "6-10" },
          { id: "se8", exerciseId: "ex6", sessionId: "sess2", sortOrder: 2, targetSets: 4, targetReps: "6-10" },
          { id: "se9", exerciseId: "ex11", sessionId: "sess2", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
          { id: "se10", exerciseId: "ex15", sessionId: "sess2", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess3", name: "Legs A", dayOfWeek: 3, programId: "prog1", sortOrder: 2,
        exercises: [
          { id: "se11", exerciseId: "ex19", sessionId: "sess3", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se12", exerciseId: "ex22", sessionId: "sess3", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se13", exerciseId: "ex20", sessionId: "sess3", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se14", exerciseId: "ex25", sessionId: "sess3", sortOrder: 3, targetSets: 4, targetReps: "12-15" },
          { id: "se15", exerciseId: "ex27", sessionId: "sess3", sortOrder: 4, targetSets: 3, targetReps: "45s" },
        ],
      },
      {
        id: "sess4", name: "Push B", dayOfWeek: 4, programId: "prog1", sortOrder: 3,
        exercises: [
          { id: "se16", exerciseId: "ex2", sessionId: "sess4", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se17", exerciseId: "ex4", sessionId: "sess4", sortOrder: 1, targetSets: 3, targetReps: "12-15" },
          { id: "se18", exerciseId: "ex30", sessionId: "sess4", sortOrder: 2, targetSets: 3, targetReps: "8-12" },
          { id: "se19", exerciseId: "ex17", sessionId: "sess4", sortOrder: 3, targetSets: 3, targetReps: "10-15" },
        ],
      },
      {
        id: "sess5", name: "Pull B", dayOfWeek: 5, programId: "prog1", sortOrder: 4,
        exercises: [
          { id: "se20", exerciseId: "ex9", sessionId: "sess5", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se21", exerciseId: "ex8", sessionId: "sess5", sortOrder: 1, targetSets: 4, targetReps: "10-12" },
          { id: "se22", exerciseId: "ex10", sessionId: "sess5", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se23", exerciseId: "ex16", sessionId: "sess5", sortOrder: 3, targetSets: 3, targetReps: "10-12" },
          { id: "se24", exerciseId: "ex29", sessionId: "sess5", sortOrder: 4, targetSets: 3, targetReps: "12-15" },
        ],
      },
      {
        id: "sess6", name: "Legs B", dayOfWeek: 6, programId: "prog1", sortOrder: 5,
        exercises: [
          { id: "se25", exerciseId: "ex24", sessionId: "sess6", sortOrder: 0, targetSets: 4, targetReps: "6-10" },
          { id: "se26", exerciseId: "ex21", sessionId: "sess6", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se27", exerciseId: "ex23", sessionId: "sess6", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se28", exerciseId: "ex28", sessionId: "sess6", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
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
    createdAt: daysAgo(30),
    sessions: [
      {
        id: "sess7", name: "Upper A", dayOfWeek: 1, programId: "prog2", sortOrder: 0,
        exercises: [
          { id: "se29", exerciseId: "ex1", sessionId: "sess7", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se30", exerciseId: "ex7", sessionId: "sess7", sortOrder: 1, targetSets: 4, targetReps: "6-10" },
          { id: "se31", exerciseId: "ex12", sessionId: "sess7", sortOrder: 2, targetSets: 3, targetReps: "6-10" },
          { id: "se32", exerciseId: "ex8", sessionId: "sess7", sortOrder: 3, targetSets: 3, targetReps: "10-12" },
          { id: "se33", exerciseId: "ex15", sessionId: "sess7", sortOrder: 4, targetSets: 3, targetReps: "10-12" },
          { id: "se34", exerciseId: "ex17", sessionId: "sess7", sortOrder: 5, targetSets: 3, targetReps: "10-12" },
        ],
      },
      {
        id: "sess8", name: "Lower A", dayOfWeek: 2, programId: "prog2", sortOrder: 1,
        exercises: [
          { id: "se35", exerciseId: "ex19", sessionId: "sess8", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se36", exerciseId: "ex22", sessionId: "sess8", sortOrder: 1, targetSets: 3, targetReps: "8-10" },
          { id: "se37", exerciseId: "ex20", sessionId: "sess8", sortOrder: 2, targetSets: 3, targetReps: "10-12" },
          { id: "se38", exerciseId: "ex19", sessionId: "sess8", sortOrder: 0, targetSets: 4, targetReps: "6-10" },
          { id: "se39", exerciseId: "ex22", sessionId: "sess8", sortOrder: 1, targetSets: 3, targetReps: "8-12" },
          { id: "se40", exerciseId: "ex25", sessionId: "sess8", sortOrder: 2, targetSets: 4, targetReps: "15-20" },
          { id: "se41", exerciseId: "ex27", sessionId: "sess8", sortOrder: 3, targetSets: 3, targetReps: "60s" },
        ],
      },
      {
        id: "sess9", name: "Upper B", dayOfWeek: 3, programId: "prog2", sortOrder: 2,
        exercises: [
          { id: "se42", exerciseId: "ex2", sessionId: "sess9", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se43", exerciseId: "ex8", sessionId: "sess9", sortOrder: 1, targetSets: 4, targetReps: "10-12" },
          { id: "se44", exerciseId: "ex13", sessionId: "sess9", sortOrder: 2, targetSets: 3, targetReps: "15-20" },
          { id: "se45", exerciseId: "ex18", sessionId: "sess9", sortOrder: 3, targetSets: 3, targetReps: "10-15" },
          { id: "se46", exerciseId: "ex29", sessionId: "sess9", sortOrder: 4, targetSets: 3, targetReps: "15" },
        ],
      },
      {
        id: "sess10", name: "Lower B", dayOfWeek: 4, programId: "prog2", sortOrder: 3,
        exercises: [
          { id: "se47", exerciseId: "ex26", sessionId: "sess10", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se48", exerciseId: "ex24", sessionId: "sess10", sortOrder: 1, targetSets: 3, targetReps: "10-15" },
          { id: "se49", exerciseId: "ex21", sessionId: "sess10", sortOrder: 2, targetSets: 3, targetReps: "8-12" },
          { id: "se50", exerciseId: "ex28", sessionId: "sess10", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
        ],
      },
    ],
  },
];
