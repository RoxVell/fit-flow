"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { notifyQueueChanged } from "@/lib/api/replay-on-reconnect";
import type {
  BodyMeasurement,
  CardioSession,
  Exercise,
  ExerciseFilters,
  PersonalRecord,
  WorkoutLog,
  WorkoutProgram,
} from "@/lib/db/types";

function unwrap<T>(result: { ok: true; data: T } | { ok: true; queued: true; id: string } | { ok: false; status: number; error: string }): T {
  if (!result.ok) {
    throw new Error(result.error);
  }
  if ("queued" in result) {
    notifyQueueChanged();
    return undefined as T;
  }
  return result.data;
}

function throwIfFailed<T>(result: { ok: true; data: T } | { ok: true; queued: true; id: string } | { ok: false; status: number; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  if ("queued" in result) {
    notifyQueueChanged();
    return undefined as T;
  }
  return result.data;
}

export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      const result = await apiGet<Exercise[]>("/api/exercises");
      return unwrap(result);
    },
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const result = await apiGet<Exercise | null>(`/api/exercises/${id}`);
      return unwrap(result);
    },
    enabled: !!id,
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const result = await apiGet<WorkoutProgram[]>("/api/programs");
      return unwrap(result);
    },
  });
}

export function useActiveProgram() {
  return useQuery({
    queryKey: ["programs", "active"],
    queryFn: async () => {
      const result = await apiGet<WorkoutProgram | null>("/api/programs/active");
      return unwrap(result);
    },
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: async () => {
      const result = await apiGet<WorkoutProgram | null>(`/api/programs/${id}`);
      return unwrap(result);
    },
    enabled: !!id,
  });
}

export function useWorkoutLogs(limit?: number) {
  return useQuery({
    queryKey: ["workout-logs", limit],
    queryFn: async () => {
      const result = await apiGet<WorkoutLog[]>(
        `/api/workout-logs${limit ? `?limit=${limit}` : ""}`
      );
      return unwrap(result);
    },
  });
}

export function useWorkoutLog(id: string) {
  return useQuery({
    queryKey: ["workout-log", id],
    queryFn: async () => {
      const result = await apiGet<WorkoutLog | null>(`/api/workout-logs/${id}`);
      return unwrap(result);
    },
    enabled: !!id,
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise-history", exerciseId],
    queryFn: async () => {
      const result = await apiGet<{ date: string; volume: number; maxWeight: number; estimated1RM: number }[]>(
        `/api/exercise-history/${exerciseId}`
      );
      return unwrap(result);
    },
    enabled: !!exerciseId,
  });
}

export function useExerciseDetailedHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise-detailed-history", exerciseId],
    queryFn: async () => {
      const result = await apiGet<
        {
          date: string;
          bestE1RM: number;
          sets: { weight: number; reps: number; type: string; setOrder: number }[];
        }[]
      >(`/api/exercise-detailed-history/${exerciseId}`);
      return unwrap(result);
    },
    enabled: !!exerciseId,
  });
}

export function useBodyMeasurements() {
  return useQuery({
    queryKey: ["body-measurements"],
    queryFn: async () => {
      const result = await apiGet<BodyMeasurement[]>("/api/body-measurements");
      return unwrap(result);
    },
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ["personal-records"],
    queryFn: async () => {
      const result = await apiGet<PersonalRecord[]>("/api/personal-records");
      return unwrap(result);
    },
  });
}

export function useCardioSessions() {
  return useQuery({
    queryKey: ["cardio-sessions"],
    queryFn: async () => {
      const result = await apiGet<CardioSession[]>("/api/cardio-sessions");
      return unwrap(result);
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const result = await apiGet<
        import("@/lib/db/types").DashboardStats
      >("/api/dashboard-stats");
      return unwrap(result);
    },
  });
}

export function useCreateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<WorkoutLog, "id">) => {
      const result = await apiPost<WorkoutLog>("/api/workout-logs", data);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["personal-records"] });
    },
  });
}

export function useUpdateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkoutLog> }) => {
      const result = await apiPut<WorkoutLog>(`/api/workout-logs/${id}`, data);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiDelete(`/api/workout-logs/${id}`);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["personal-records"] });
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof apiPost>[1]) => {
      const result = await apiPost<WorkoutProgram>("/api/programs", data);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["programs", "active"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof apiPut>[1];
    }) => {
      const result = await apiPut<WorkoutProgram>(`/api/programs/${id}`, data);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["programs", "active"] });
    },
  });
}

export function useCreateCardioSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CardioSession, "id">) => {
      const result = await apiPost<CardioSession>("/api/cardio-sessions", data);
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cardio-sessions"] });
    },
  });
}

export function useLogBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<BodyMeasurement, "id">) => {
      const result = await apiPost<BodyMeasurement>(
        "/api/body-measurements",
        data
      );
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCreatePersonalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PersonalRecord, "id">) => {
      const result = await apiPost<PersonalRecord>(
        "/api/personal-records",
        data
      );
      return throwIfFailed(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personal-records"] });
    },
  });
}
