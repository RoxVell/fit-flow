import type {
  Exercise,
  WorkoutProgram,
  WorkoutLog,
  BodyMeasurement,
  PersonalRecord,
  CardioSession,
  DashboardStats,
} from "./types";

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
function hoursAgo(h: number): string {
  const d = new Date(now);
  d.setHours(d.getHours() - h);
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
          { id: "se1", exerciseId: "ex1", sessionId: "sess1", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se2", exerciseId: "ex3", sessionId: "sess1", sortOrder: 1, targetSets: 3, targetReps: "10-12" },
          { id: "se3", exerciseId: "ex12", sessionId: "sess1", sortOrder: 2, targetSets: 4, targetReps: "8-12" },
          { id: "se4", exerciseId: "ex13", sessionId: "sess1", sortOrder: 3, targetSets: 3, targetReps: "15-20" },
          { id: "se5", exerciseId: "ex17", sessionId: "sess1", sortOrder: 4, targetSets: 3, targetReps: "12-15" },
          { id: "se6", exerciseId: "ex29", sessionId: "sess1", sortOrder: 5, targetSets: 3, targetReps: "15" },
        ],
      },
      {
        id: "sess2", name: "Pull A", dayOfWeek: 2, programId: "prog1", sortOrder: 1,
        exercises: [
          { id: "se7", exerciseId: "ex26", sessionId: "sess2", sortOrder: 0, targetSets: 4, targetReps: "5-8" },
          { id: "se8", exerciseId: "ex6", sessionId: "sess2", sortOrder: 1, targetSets: 4, targetReps: "8-12" },
          { id: "se9", exerciseId: "ex9", sessionId: "sess2", sortOrder: 2, targetSets: 3, targetReps: "10-15" },
          { id: "se10", exerciseId: "ex11", sessionId: "sess2", sortOrder: 3, targetSets: 3, targetReps: "15-20" },
          { id: "se11", exerciseId: "ex15", sessionId: "sess2", sortOrder: 4, targetSets: 3, targetReps: "10-15" },
          { id: "se12", exerciseId: "ex28", sessionId: "sess2", sortOrder: 5, targetSets: 3, targetReps: "12-15" },
        ],
      },
      {
        id: "sess3", name: "Legs A", dayOfWeek: 3, programId: "prog1", sortOrder: 2,
        exercises: [
          { id: "se13", exerciseId: "ex19", sessionId: "sess3", sortOrder: 0, targetSets: 4, targetReps: "6-10" },
          { id: "se14", exerciseId: "ex22", sessionId: "sess3", sortOrder: 1, targetSets: 3, targetReps: "8-12" },
          { id: "se15", exerciseId: "ex20", sessionId: "sess3", sortOrder: 2, targetSets: 3, targetReps: "10-15" },
          { id: "se16", exerciseId: "ex23", sessionId: "sess3", sortOrder: 3, targetSets: 3, targetReps: "12-15" },
          { id: "se17", exerciseId: "ex25", sessionId: "sess3", sortOrder: 4, targetSets: 4, targetReps: "15-20" },
        ],
      },
      {
        id: "sess4", name: "Push B", dayOfWeek: 4, programId: "prog1", sortOrder: 3,
        exercises: [
          { id: "se18", exerciseId: "ex2", sessionId: "sess4", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se19", exerciseId: "ex31", sessionId: "sess4", sortOrder: 1, targetSets: 3, targetReps: "10-15" },
          { id: "se20", exerciseId: "ex30", sessionId: "sess4", sortOrder: 2, targetSets: 4, targetReps: "8-12" },
          { id: "se21", exerciseId: "ex32", sessionId: "sess4", sortOrder: 3, targetSets: 3, targetReps: "15-20" },
          { id: "se22", exerciseId: "ex18", sessionId: "sess4", sortOrder: 4, targetSets: 3, targetReps: "12-15" },
          { id: "se23", exerciseId: "ex4", sessionId: "sess4", sortOrder: 5, targetSets: 3, targetReps: "15-20" },
        ],
      },
      {
        id: "sess5", name: "Pull B", dayOfWeek: 5, programId: "prog1", sortOrder: 4,
        exercises: [
          { id: "se24", exerciseId: "ex7", sessionId: "sess5", sortOrder: 0, targetSets: 4, targetReps: "8-12" },
          { id: "se25", exerciseId: "ex8", sessionId: "sess5", sortOrder: 1, targetSets: 4, targetReps: "10-12" },
          { id: "se26", exerciseId: "ex10", sessionId: "sess5", sortOrder: 2, supersetGroupId: "sg1", targetSets: 3, targetReps: "10-12" },
          { id: "se27", exerciseId: "ex16", sessionId: "sess5", sortOrder: 3, supersetGroupId: "sg1", targetSets: 3, targetReps: "12-15" },
          { id: "se28", exerciseId: "ex34", sessionId: "sess5", sortOrder: 4, targetSets: 3, targetReps: "30s" },
        ],
      },
      {
        id: "sess6", name: "Legs B", dayOfWeek: 6, programId: "prog1", sortOrder: 5,
        exercises: [
          { id: "se29", exerciseId: "ex21", sessionId: "sess6", sortOrder: 0, targetSets: 3, targetReps: "8-12" },
          { id: "se30", exerciseId: "ex24", sessionId: "sess6", sortOrder: 1, targetSets: 4, targetReps: "10-15" },
          { id: "se31", exerciseId: "ex33", sessionId: "sess6", sortOrder: 2, targetSets: 3, targetReps: "12-15" },
          { id: "se32", exerciseId: "ex25", sessionId: "sess6", sortOrder: 3, targetSets: 4, targetReps: "15-20" },
        ],
      },
    ],
  },
  {
    id: "prog2",
    name: "Upper/Lower",
    description: "Upper / Lower split — 4 days per week. Great for busy schedules.",
    daysPerWeek: 4,
    isActive: false,
    createdAt: daysAgo(120),
    sessions: [
      {
        id: "sess7", name: "Upper A", dayOfWeek: 1, programId: "prog2", sortOrder: 0,
        exercises: [
          { id: "se33", exerciseId: "ex1", sessionId: "sess7", sortOrder: 0, targetSets: 4, targetReps: "6-10" },
          { id: "se34", exerciseId: "ex7", sessionId: "sess7", sortOrder: 1, targetSets: 4, targetReps: "8-12" },
          { id: "se35", exerciseId: "ex12", sessionId: "sess7", sortOrder: 2, targetSets: 3, targetReps: "8-12" },
          { id: "se36", exerciseId: "ex15", sessionId: "sess7", sortOrder: 3, targetSets: 3, targetReps: "10-15" },
          { id: "se37", exerciseId: "ex17", sessionId: "sess7", sortOrder: 4, targetSets: 3, targetReps: "12-15" },
        ],
      },
      {
        id: "sess8", name: "Lower A", dayOfWeek: 2, programId: "prog2", sortOrder: 1,
        exercises: [
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

function generateLoggedSets(
  baseWeight: number, baseReps: number, sets: number, weeks: number, decrease: boolean
): LoggedSetGen[] {
  const result: LoggedSetGen[] = [];
  for (let w = weeks; w >= 0; w--) {
    const weekSets: LoggedSetGen["sets"] = [];
    const progress = decrease ? w * 0.5 : (weeks - w) * 0.5;
    const wWeight = Math.round((baseWeight + progress) * 2) / 2;
    const wReps = Math.max(6, Math.round(baseReps + (weeks - w) * 0.3));
    for (let s = 0; s < sets; s++) {
      const drop = s * 0.05;
      const setWeight = Math.round(wWeight * (1 - drop) * 2) / 2;
      const setReps = s === 0 ? wReps : Math.max(6, Math.round(wReps * (1 - s * 0.03)));
      weekSets.push({
        type: s === 0 && w < 2 ? "warmup" as const : "working" as const,
        setOrder: s,
        reps: setReps,
        weight: setWeight,
        completed: true,
      });
    }
    result.push({
      date: daysAgo(w * 7 + Math.floor(Math.random() * 3)),
      sets: weekSets,
    });
  }
  return result;
}

interface LoggedSetGen {
  date: string;
  sets: {
    type: "working" | "warmup" | "dropset";
    setOrder: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
}

const benchHistory = generateLoggedSets(60, 10, 4, 8, false);
const squatHistory = generateLoggedSets(80, 8, 4, 8, false);
const deadliftHistory = generateLoggedSets(100, 6, 4, 8, false);
const ohpHistory = generateLoggedSets(40, 8, 4, 8, false);
const rowHistory = generateLoggedSets(55, 10, 4, 8, false);
const pullupHistory = generateLoggedSets(70, 8, 4, 8, false);
const legpressHistory = generateLoggedSets(140, 10, 3, 6, false);
const rdlHistory = generateLoggedSets(70, 10, 3, 6, false);

const historyMap: Record<string, LoggedSetGen[]> = {
  ex1: benchHistory,
  ex19: squatHistory,
  ex26: deadliftHistory,
  ex12: ohpHistory,
  ex7: rowHistory,
  ex6: pullupHistory,
  ex20: legpressHistory,
  ex22: rdlHistory,
};

export function generateWorkoutLogs(): WorkoutLog[] {
  const allLogs: WorkoutLog[] = [];
  let logId = 1;

  // Generate 8 weeks of PPL logs
  for (let w = 0; w < 8; w++) {
    const sessions = programs[0].sessions;
    for (const session of sessions) {
      // Skip some random sessions for realism
      if (Math.random() < 0.15 && w < 7) continue;
      const exercisesInSession: WorkoutLog["exercises"] = [];
      for (const se of session.exercises) {
        const history = historyMap[se.exerciseId];
        const weekHistory = history ? history[Math.min(w, history.length - 1)] : undefined;
        const sets = weekHistory
          ? weekHistory.sets.map((s, i) => ({
              id: `ls${logId}-${i}`,
              loggedExerciseId: `le${logId}`,
              ...s,
            }))
          : Array.from({ length: se.targetSets }, (_, i) => ({
              id: `ls${logId}-${i}`,
              loggedExerciseId: `le${logId}`,
              type: i === 0 ? "warmup" as const : "working" as const,
              setOrder: i,
              reps: 10,
              weight: 20 + i * 5,
              completed: true,
            }));
        exercisesInSession.push({
          id: `le${logId}`,
          exerciseId: se.exerciseId,
          workoutLogId: `wl${logId}`,
          sortOrder: se.sortOrder,
          supersetGroupId: se.supersetGroupId,
          sets,
        });
        logId++;
      }
      allLogs.push({
        id: `wl${logId}`,
        startedAt: daysAgo(w * 7 + (session.dayOfWeek - 1) + 8),
        endedAt: daysAgo(w * 7 + (session.dayOfWeek - 1) + 8 - 1),
        programId: "prog1",
        sessionId: session.id,
        programName: "PPL",
        sessionName: session.name,
        exercises: exercisesInSession,
      });
      logId++;
    }
  }

  return allLogs;
}

export const workoutLogs: WorkoutLog[] = generateWorkoutLogs();

export const bodyMeasurements: BodyMeasurement[] = [
  { id: "bm1", date: daysAgo(60), weight: 78.5, bodyFat: 16.2, chest: 102, waist: 82, arms: 36, thighs: 56 },
  { id: "bm2", date: daysAgo(45), weight: 79.1, bodyFat: 15.8, chest: 103, waist: 81, arms: 36.5, thighs: 56.5 },
  { id: "bm3", date: daysAgo(30), weight: 79.8, bodyFat: 15.5, chest: 103.5, waist: 80.5, arms: 37, thighs: 57 },
  { id: "bm4", date: daysAgo(14), weight: 80.2, bodyFat: 15.1, chest: 104, waist: 80, arms: 37.5, thighs: 57.5 },
  { id: "bm5", date: daysAgo(0), weight: 80.5, bodyFat: 14.8, chest: 104.5, waist: 79.5, arms: 38, thighs: 58 },
];

export const personalRecords: PersonalRecord[] = [
  { id: "pr1", exerciseId: "ex1", exerciseName: "Barbell Bench Press", type: "estimated_1rm", value: 92.5, date: daysAgo(7) },
  { id: "pr2", exerciseId: "ex1", exerciseName: "Barbell Bench Press", type: "weight", value: 80, date: daysAgo(7) },
  { id: "pr3", exerciseId: "ex1", exerciseName: "Barbell Bench Press", type: "volume", value: 2880, date: daysAgo(14) },
  { id: "pr4", exerciseId: "ex19", exerciseName: "Squat", type: "estimated_1rm", value: 125, date: daysAgo(3) },
  { id: "pr5", exerciseId: "ex19", exerciseName: "Squat", type: "weight", value: 110, date: daysAgo(3) },
  { id: "pr6", exerciseId: "ex26", exerciseName: "Deadlift", type: "estimated_1rm", value: 150, date: daysAgo(10) },
  { id: "pr7", exerciseId: "ex26", exerciseName: "Deadlift", type: "weight", value: 140, date: daysAgo(10) },
  { id: "pr8", exerciseId: "ex12", exerciseName: "Overhead Press", type: "estimated_1rm", value: 60, date: daysAgo(5) },
  { id: "pr9", exerciseId: "ex12", exerciseName: "Overhead Press", type: "weight", value: 52.5, date: daysAgo(5) },
  { id: "pr10", exerciseId: "ex7", exerciseName: "Barbell Row", type: "estimated_1rm", value: 85, date: daysAgo(8) },
];

export const cardioSessions: CardioSession[] = [
  { id: "c1", type: "run", distance: 5, duration: 28, avgHeartRate: 155, date: daysAgo(10) },
  { id: "c2", type: "run", distance: 3, duration: 16, avgHeartRate: 150, date: daysAgo(6) },
  { id: "c3", type: "cycle", distance: 15, duration: 35, avgHeartRate: 140, date: daysAgo(3) },
  { id: "c4", type: "elliptical", distance: 4, duration: 25, avgHeartRate: 145, date: daysAgo(1) },
];

export function getDashboardStatsMock(): DashboardStats {
  const thisWeek = workoutLogs.filter((l) => {
    const d = new Date(l.startedAt);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const heatmapData: DashboardStats["heatmapData"] = {
    chest: 3, back: 4, shoulders: 3, biceps: 2, triceps: 3, forearms: 1,
    quads: 2, hamstrings: 2, glutes: 2, calves: 1, abs: 2, traps: 2, hip_flexors: 1, full_body: 0,
  };

  return {
    weeklyWorkouts: thisWeek.length,
    weeklyVolume: thisWeek.reduce((sum, l) => {
      return sum + l.exercises.reduce((es, e) => {
        return es + e.sets.reduce((ss, s) => ss + s.weight * s.reps, 0);
      }, 0);
    }, 0),
    currentWeight: 80.5,
    weightTrend: "up",
    steps: 8432,
    calories: 345,
    activeDays: 5,
    nextSession: programs[0].sessions[Math.floor((new Date().getDay() - 1 + 6) % 7)],
    heatmapData,
  };
}
