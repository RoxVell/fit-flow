import type {
  BodyMeasurement,
  LoggedExercise,
  LoggedSet,
  PersonalRecord,
  WorkoutLog,
} from "@/lib/db/types";
import type { BodyPart, ExerciseManifestItem } from "@/lib/exercises/types";
import { bestE1RM, e1RM, volume } from "@/lib/training-metrics";

export const BODY_PARTS: BodyPart[] = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "LEGS",
  "GLUTEUS",
  "ABS",
];

export type ExerciseRef = {
  id: string;
  name: string;
  bodyPart: BodyPart;
  thumbnailUri: string | null;
};

export type ExerciseIndex = Map<string, ExerciseRef>;

export function buildExerciseIndex(
  manifest: ExerciseManifestItem[],
  pick: (item: ExerciseManifestItem) => string
): ExerciseIndex {
  return new Map(
    manifest.map((item) => [
      item.id,
      {
        id: item.id,
        name: pick(item),
        bodyPart: item.bodyPart,
        thumbnailUri: item.thumbnailUri,
      },
    ])
  );
}

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

export function completedSets(ex: LoggedExercise): LoggedSet[] {
  return ex.sets.filter((s) => s.completed);
}

export function isFinished(log: WorkoutLog): boolean {
  return Boolean(log.endedAt);
}

export function logVolume(log: WorkoutLog): number {
  return log.exercises.reduce((sum, ex) => sum + volume(completedSets(ex)), 0);
}

export function logSetCount(log: WorkoutLog): number {
  return log.exercises.reduce((sum, ex) => sum + completedSets(ex).length, 0);
}

export function logRepCount(log: WorkoutLog): number {
  return log.exercises.reduce(
    (sum, ex) => sum + completedSets(ex).reduce((r, s) => r + s.reps, 0),
    0
  );
}

/** Duration in minutes, or null when the session was never closed. */
export function logDuration(log: WorkoutLog): number | null {
  if (!log.endedAt) return null;
  const ms = new Date(log.endedAt).getTime() - new Date(log.startedAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(ms / 60000);
}

export function dayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export type Delta = {
  current: number;
  previous: number;
  /** Signed percentage change; null when there is no comparable baseline. */
  percent: number | null;
};

export function toDelta(current: number, previous: number): Delta {
  const percent =
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
  return { current, previous, percent };
}

/**
 * The last earlier run of the same session (by name), so a workout can be read
 * against its own baseline rather than against a different training day.
 * Expects `logs` newest-first, as `useAllWorkoutLogs` returns them.
 */
export function findPreviousSession<T extends WorkoutLog>(
  logs: T[],
  log: T
): T | null {
  const name = log.sessionName ?? log.programName;
  if (!name) return null;
  const start = logs.indexOf(log);
  for (let i = start + 1; i < logs.length; i++) {
    const candidate = logs[i];
    if ((candidate.sessionName ?? candidate.programName) === name) return candidate;
  }
  return null;
}

/** Best estimated 1RM across completed sets; 0 when nothing qualifies. */
export function exerciseBestE1rm(exercise: LoggedExercise): number {
  return bestE1RM(
    completedSets(exercise).filter((set) => set.weight > 0 && set.reps > 0)
  );
}

export type KpiSnapshot = {
  workouts: Delta;
  volume: Delta;
  sets: Delta;
  reps: Delta;
  /** Average session length in minutes. */
  duration: Delta;
  /** Distinct training days in the window. */
  activeDays: Delta;
  /** Average kg per completed rep — a rough intensity proxy. */
  intensity: Delta;
};

export function computeKpis(logs: WorkoutLog[], windowDays: number): KpiSnapshot {
  const now = Date.now();
  const windowMs = windowDays * 86400000;
  const currentFrom = now - windowMs;
  const previousFrom = now - windowMs * 2;

  const current = logs.filter((l) => new Date(l.startedAt).getTime() >= currentFrom);
  const previous = logs.filter((l) => {
    const t = new Date(l.startedAt).getTime();
    return t >= previousFrom && t < currentFrom;
  });

  const bucket = (group: WorkoutLog[]) => {
    const vol = group.reduce((s, l) => s + logVolume(l), 0);
    const sets = group.reduce((s, l) => s + logSetCount(l), 0);
    const reps = group.reduce((s, l) => s + logRepCount(l), 0);
    const durations = group
      .map(logDuration)
      .filter((d): d is number => d !== null && d > 0 && d < 480);
    return {
      workouts: group.length,
      volume: Math.round(vol),
      sets,
      reps,
      duration: durations.length
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : 0,
      activeDays: new Set(group.map((l) => dayKey(l.startedAt))).size,
      intensity: reps > 0 ? Math.round((vol / reps) * 10) / 10 : 0,
    };
  };

  const c = bucket(current);
  const p = bucket(previous);

  return {
    workouts: toDelta(c.workouts, p.workouts),
    volume: toDelta(c.volume, p.volume),
    sets: toDelta(c.sets, p.sets),
    reps: toDelta(c.reps, p.reps),
    duration: toDelta(c.duration, p.duration),
    activeDays: toDelta(c.activeDays, p.activeDays),
    intensity: toDelta(c.intensity, p.intensity),
  };
}

/* ------------------------------------------------------------------ */
/* time series                                                         */
/* ------------------------------------------------------------------ */

export type WeekPoint = {
  weekStart: string;
  volume: number;
  sets: number;
  workouts: number;
  duration: number;
  intensity: number;
};

export function buildWeeklySeries(logs: WorkoutLog[], weeks: number): WeekPoint[] {
  const buckets = new Map<string, WeekPoint>();
  const first = startOfWeek(new Date());
  first.setDate(first.getDate() - (weeks - 1) * 7);

  for (let i = 0; i < weeks; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    buckets.set(d.toISOString(), {
      weekStart: d.toISOString(),
      volume: 0,
      sets: 0,
      workouts: 0,
      duration: 0,
      intensity: 0,
    });
  }

  const repsPerWeek = new Map<string, number>();
  const durationSamples = new Map<string, number[]>();

  for (const log of logs) {
    const key = startOfWeek(new Date(log.startedAt)).toISOString();
    const point = buckets.get(key);
    if (!point) continue;
    point.volume += logVolume(log);
    point.sets += logSetCount(log);
    point.workouts += 1;
    repsPerWeek.set(key, (repsPerWeek.get(key) ?? 0) + logRepCount(log));
    const dur = logDuration(log);
    if (dur !== null && dur > 0 && dur < 480) {
      const arr = durationSamples.get(key) ?? [];
      arr.push(dur);
      durationSamples.set(key, arr);
    }
  }

  return [...buckets.values()].map((point) => {
    const reps = repsPerWeek.get(point.weekStart) ?? 0;
    const durs = durationSamples.get(point.weekStart) ?? [];
    return {
      ...point,
      volume: Math.round(point.volume),
      intensity: reps > 0 ? Math.round((point.volume / reps) * 10) / 10 : 0,
      duration: durs.length
        ? Math.round(durs.reduce((s, d) => s + d, 0) / durs.length)
        : 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* muscle split                                                        */
/* ------------------------------------------------------------------ */

export type MuscleSlice = {
  bodyPart: BodyPart;
  sets: number;
  volume: number;
  share: number;
  previousSets: number;
};

export function computeMuscleSplit(
  logs: WorkoutLog[],
  index: ExerciseIndex,
  windowDays: number
): MuscleSlice[] {
  const now = Date.now();
  const windowMs = windowDays * 86400000;

  const sets = new Map<BodyPart, number>();
  const vols = new Map<BodyPart, number>();
  const prevSets = new Map<BodyPart, number>();

  for (const log of logs) {
    const t = new Date(log.startedAt).getTime();
    const isCurrent = t >= now - windowMs;
    const isPrevious = !isCurrent && t >= now - windowMs * 2;
    if (!isCurrent && !isPrevious) continue;

    for (const ex of log.exercises) {
      const ref = index.get(ex.exerciseId);
      if (!ref) continue;
      const done = completedSets(ex);
      if (done.length === 0) continue;
      if (isCurrent) {
        sets.set(ref.bodyPart, (sets.get(ref.bodyPart) ?? 0) + done.length);
        vols.set(ref.bodyPart, (vols.get(ref.bodyPart) ?? 0) + volume(done));
      } else {
        prevSets.set(ref.bodyPart, (prevSets.get(ref.bodyPart) ?? 0) + done.length);
      }
    }
  }

  const total = [...sets.values()].reduce((s, v) => s + v, 0);

  return BODY_PARTS.map((bodyPart) => {
    const value = sets.get(bodyPart) ?? 0;
    return {
      bodyPart,
      sets: value,
      volume: Math.round(vols.get(bodyPart) ?? 0),
      share: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      previousSets: prevSets.get(bodyPart) ?? 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* consistency                                                         */
/* ------------------------------------------------------------------ */

export type CalendarCell = {
  date: string;
  volume: number;
  sets: number;
  workouts: number;
};

export function buildCalendar(logs: WorkoutLog[], days: number): CalendarCell[] {
  const map = new Map<string, CalendarCell>();
  const start = daysAgo(days - 1);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(dayKey(d), { date: dayKey(d), volume: 0, sets: 0, workouts: 0 });
  }

  for (const log of logs) {
    const cell = map.get(dayKey(log.startedAt));
    if (!cell) continue;
    cell.volume += logVolume(log);
    cell.sets += logSetCount(log);
    cell.workouts += 1;
  }

  return [...map.values()];
}

export type StreakInfo = {
  /** Consecutive weeks, counting back from this week, with at least one session. */
  currentWeeks: number;
  longestWeeks: number;
  /** Consecutive training days ending today or yesterday. */
  currentDays: number;
  longestDays: number;
};

export function computeStreaks(logs: WorkoutLog[]): StreakInfo {
  const days = new Set(logs.map((l) => dayKey(l.startedAt)));
  const weeks = new Set(
    logs.map((l) => startOfWeek(new Date(l.startedAt)).toISOString())
  );

  let currentDays = 0;
  for (let i = 0; i < 400; i++) {
    if (days.has(dayKey(daysAgo(i)))) currentDays++;
    else if (i > 0 || !days.has(dayKey(daysAgo(1)))) break;
  }

  let longestDays = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of [...days].sort()) {
    const d = new Date(key + "T00:00:00");
    if (previous && (d.getTime() - previous.getTime()) / 86400000 === 1) run++;
    else run = 1;
    longestDays = Math.max(longestDays, run);
    previous = d;
  }

  let currentWeeks = 0;
  for (let i = 0; i < 200; i++) {
    const w = startOfWeek(new Date());
    w.setDate(w.getDate() - i * 7);
    if (weeks.has(w.toISOString())) currentWeeks++;
    else if (i > 0) break;
  }

  let longestWeeks = 0;
  let weekRun = 0;
  let previousWeek: Date | null = null;
  for (const iso of [...weeks].sort()) {
    const d = new Date(iso);
    if (previousWeek && (d.getTime() - previousWeek.getTime()) / 86400000 === 7)
      weekRun++;
    else weekRun = 1;
    longestWeeks = Math.max(longestWeeks, weekRun);
    previousWeek = d;
  }

  return { currentWeeks, longestWeeks, currentDays, longestDays };
}

/** Sessions bucketed by weekday index (0 = Sunday) and 2-hour block. */
export function buildRhythm(
  logs: WorkoutLog[]
): { day: number; hour: number; count: number }[] {
  const cells = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.startedAt);
    const key = d.getDay() + ":" + Math.floor(d.getHours() / 2) * 2;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const out: { day: number; hour: number; count: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour += 2) {
      out.push({ day, hour, count: cells.get(day + ":" + hour) ?? 0 });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* exercise leaderboard                                                */
/* ------------------------------------------------------------------ */

export type ExerciseStatRow = {
  exerciseId: string;
  name: string;
  bodyPart: BodyPart;
  thumbnailUri: string | null;
  sessions: number;
  sets: number;
  reps: number;
  volume: number;
  bestWeight: number;
  bestE1rm: number;
  firstE1rm: number;
  /** Percent change of estimated 1RM between the first and latest session. */
  trend: number | null;
  lastPerformed: string | null;
  sparkline: number[];
};

type ExerciseAccumulator = ExerciseStatRow & {
  series: { at: number; e1rm: number }[];
};

export function buildExerciseStats(
  logs: WorkoutLog[],
  index: ExerciseIndex
): ExerciseStatRow[] {
  const rows = new Map<string, ExerciseAccumulator>();

  for (const log of logs) {
    const at = new Date(log.startedAt).getTime();
    for (const ex of log.exercises) {
      const done = completedSets(ex);
      if (done.length === 0) continue;
      const ref = index.get(ex.exerciseId);
      const existing = rows.get(ex.exerciseId);
      const row: ExerciseAccumulator = existing ?? {
        exerciseId: ex.exerciseId,
        name: ref?.name ?? ex.exercise?.name ?? ex.exerciseId,
        bodyPart: ref?.bodyPart ?? "CHEST",
        thumbnailUri: ref?.thumbnailUri ?? null,
        sessions: 0,
        sets: 0,
        reps: 0,
        volume: 0,
        bestWeight: 0,
        bestE1rm: 0,
        firstE1rm: 0,
        trend: null,
        lastPerformed: null,
        sparkline: [],
        series: [],
      };

      row.sessions += 1;
      row.sets += done.length;
      row.reps += done.reduce((s, x) => s + x.reps, 0);
      row.volume += volume(done);
      row.bestWeight = Math.max(row.bestWeight, ...done.map((s) => s.weight));

      if (!ex.excludeFromStats) {
        const scoring = done.filter((s) => s.weight > 0 && s.reps > 0);
        if (scoring.length > 0) {
          const best = bestE1RM(scoring);
          row.bestE1rm = Math.max(row.bestE1rm, best);
          row.series.push({ at, e1rm: best });
        }
      }

      if (!row.lastPerformed || new Date(row.lastPerformed).getTime() < at) {
        row.lastPerformed = log.startedAt;
      }

      rows.set(ex.exerciseId, row);
    }
  }

  return [...rows.values()]
    .map(({ series, ...row }) => {
      const ordered = series.sort((a, b) => a.at - b.at).map((p) => p.e1rm);
      const first = ordered[0] ?? 0;
      const last = ordered[ordered.length - 1] ?? 0;
      return {
        ...row,
        volume: Math.round(row.volume),
        bestE1rm: Math.round(row.bestE1rm * 10) / 10,
        firstE1rm: Math.round(first * 10) / 10,
        trend:
          ordered.length >= 2 && first > 0
            ? Math.round(((last - first) / first) * 1000) / 10
            : null,
        sparkline: ordered.slice(-12),
      };
    })
    .sort((a, b) => b.volume - a.volume);
}

export type ExercisePoint = {
  date: string;
  e1rm: number;
  volume: number;
  topWeight: number;
  reps: number;
};

/** Per-session best estimated 1RM for one exercise, oldest first. */
export function buildExerciseTimeline(
  logs: WorkoutLog[],
  exerciseId: string
): ExercisePoint[] {
  const points: ExercisePoint[] = [];

  for (const log of logs) {
    for (const ex of log.exercises) {
      if (ex.exerciseId !== exerciseId || ex.excludeFromStats) continue;
      const done = completedSets(ex).filter((s) => s.weight > 0 && s.reps > 0);
      if (done.length === 0) continue;
      const top = done.reduce((best, s) =>
        e1RM(s.weight, s.reps) > e1RM(best.weight, best.reps) ? s : best
      );
      points.push({
        date: log.startedAt,
        e1rm: Math.round(e1RM(top.weight, top.reps) * 10) / 10,
        volume: Math.round(volume(done)),
        topWeight: top.weight,
        reps: done.reduce((s, x) => s + x.reps, 0),
      });
    }
  }

  return points.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/* ------------------------------------------------------------------ */
/* records + body                                                      */
/* ------------------------------------------------------------------ */

export function sortRecords(records: PersonalRecord[]): PersonalRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export type BodyPoint = {
  date: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
};

export function buildBodySeries(measurements: BodyMeasurement[]): BodyPoint[] {
  const average = (...values: (number | undefined)[]) => {
    const present = values.filter((v): v is number => typeof v === "number");
    if (present.length === 0) return undefined;
    return Math.round((present.reduce((s, v) => s + v, 0) / present.length) * 10) / 10;
  };

  return [...measurements]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: m.date,
      weight: m.weight,
      bodyFat: m.bodyFat,
      waist: m.waist,
      chest: m.chest,
      arms: average(m.leftArm, m.rightArm),
      thighs: average(m.leftThigh, m.rightThigh),
    }));
}

/** Trailing average over the last `size` numeric samples, index-aligned. */
export function movingAverage(
  values: (number | undefined)[],
  size: number
): (number | null)[] {
  const window: number[] = [];
  return values.map((value) => {
    if (typeof value === "number") {
      window.push(value);
      if (window.length > size) window.shift();
    }
    if (window.length === 0) return null;
    return Math.round((window.reduce((s, v) => s + v, 0) / window.length) * 10) / 10;
  });
}
