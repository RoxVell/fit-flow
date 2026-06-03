import type { Exercise, WorkoutLog } from "../db/types";
import { bestWeight } from "../training-metrics";

export interface AiBriefing {
  summary: string;
  highlights: string[];
  concerns: string[];
}

export async function generateBriefing(
  recentLogs: WorkoutLog[],
  exercises: Exercise[]
): Promise<AiBriefing> {
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recent = recentLogs.filter((l) => new Date(l.startedAt) >= twoWeeksAgo);

  const exerciseProgress = new Map<string, { weights: number[]; dates: Date[] }>();

  for (const log of recent) {
    for (const ex of log.exercises) {
      if (!exerciseProgress.has(ex.exerciseId)) {
        exerciseProgress.set(ex.exerciseId, { weights: [], dates: [] });
      }
      const data = exerciseProgress.get(ex.exerciseId)!;
      const completed = ex.sets.filter((s) => s.completed);
      if (completed.length > 0) {
        const maxWeight = bestWeight(completed);
        data.weights.push(maxWeight);
        data.dates.push(new Date(log.startedAt));
      }
    }
  }

  const highlights: string[] = [];
  const concerns: string[] = [];

  for (const [exId, data] of exerciseProgress) {
    const exercise = exercises.find((e) => e.id === exId);
    if (!exercise || data.weights.length < 2) continue;

    const first = data.weights[0];
    const last = data.weights[data.weights.length - 1];

    if (last > first * 1.02) {
      highlights.push(`${exercise.name} is up ${Math.round((last / first - 1) * 100)}%`);
    } else if (last <= first * 0.98) {
      concerns.push(`${exercise.name} dropped ${Math.round((1 - last / first) * 100)}%`);
    } else {
      concerns.push(`${exercise.name} hasn't progressed in 2 weeks`);
    }
  }

  const totalWorkouts = recent.length;
  let summary: string;

  if (totalWorkouts < 4) {
    summary = `Only ${totalWorkouts} workouts in 2 weeks. Try to get at least 4 sessions for steady progress.`;
  } else if (highlights.length > concerns.length) {
    summary = `Good momentum with ${totalWorkouts} sessions. ${highlights[0] || "Keep pushing!"}`;
  } else {
    summary = `${totalWorkouts} workouts logged. ${concerns[0] || "Consider varying your routine."}`;
  }

  return { summary, highlights, concerns };
}

export async function generateProgram(query: string): Promise<{
  name: string;
  description: string;
  daysPerWeek: number;
  sessions: { name: string; exercises: string[] }[];
}> {
  const isUpperLower = query.toLowerCase().includes("upper") || query.toLowerCase().includes("lower");
  const isPPL = query.toLowerCase().includes("push") || query.toLowerCase().includes("pull");
  const isFourDay = query.toLowerCase().includes("4") || isUpperLower;
  const isSixDay = query.toLowerCase().includes("6") || isPPL;
  const focusMuscle = query.toLowerCase().includes("shoulder") ? "shoulders" : "general";

  if (isFourDay || !isSixDay) {
    return {
      name: "AI Upper/Lower Split",
      description: `4-day upper/lower split with focus on ${focusMuscle}. Generated for: "${query}"`,
      daysPerWeek: 4,
      sessions: [
        {
          name: "Upper A",
          exercises: ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Barbell Curl", "Triceps Pushdown"],
        },
        {
          name: "Lower A",
          exercises: ["Squat", "Romanian Deadlift", "Standing Calf Raise", "Plank"],
        },
        {
          name: "Upper B",
          exercises: ["Dumbbell Bench Press", "Lat Pulldown", "Lateral Raise", "Skull Crushers", "Cable Crunch"],
        },
        {
          name: "Lower B",
          exercises: ["Deadlift", "Hip Thrust", "Bulgarian Split Squat", "Hanging Leg Raise"],
        },
      ],
    };
  }

  return {
    name: "AI PPL Split",
    description: `6-day Push/Pull/Legs split with focus on ${focusMuscle}. Generated for: "${query}"`,
    daysPerWeek: 6,
    sessions: [
      { name: "Push A", exercises: ["Barbell Bench Press", "Incline Barbell Bench Press", "Overhead Press", "Lateral Raise", "Triceps Pushdown", "Cable Crunch"] },
      { name: "Pull A", exercises: ["Deadlift", "Pull-Ups", "Seated Cable Row", "Face Pull", "Barbell Curl", "Hanging Leg Raise"] },
      { name: "Legs A", exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise"] },
      { name: "Push B", exercises: ["Dumbbell Bench Press", "Dips", "Dumbbell Shoulder Press", "Dumbbell Lateral Raise", "Skull Crushers", "Cable Flyes"] },
      { name: "Pull B", exercises: ["Barbell Row", "Lat Pulldown", "Dumbbell Row", "Dumbbell Hammer Curl", "Farmers Walk"] },
      { name: "Legs B", exercises: ["Bulgarian Split Squat", "Hip Thrust", "Goblet Squat", "Standing Calf Raise"] },
    ],
  };
}

export async function getAdvice(
  exerciseName: string,
  recentHistory: { weight: number; reps: number }[]
): Promise<string> {
  if (recentHistory.length < 3) {
    return `Keep logging ${exerciseName} consistently. Once you have 3+ sessions, I can analyze your progress.`;
  }

  const last = recentHistory[recentHistory.length - 1];
  const first = recentHistory[0];

  if (last.weight <= first.weight && last.reps <= first.reps) {
    return `You've plateaued on ${exerciseName}. Try one of:
• Switch from ${recentHistory.length}×10 to 5×5 with heavier weight
• Add a pause at the bottom of each rep
• Try drop sets on your last working set
• Reduce frequency to allow more recovery`;
  }

  return `Good progress on ${exerciseName}! To keep advancing, try:
• Increase weight by 2.5kg next session
• Add 1-2 reps per set before increasing weight
• Consider technique refinements for better leverage`;
}
