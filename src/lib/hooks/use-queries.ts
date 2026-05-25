import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as queries from "@/lib/db/queries";
import type { ExerciseFilters, WorkoutLog, CardioSession, BodyMeasurement } from "@/lib/db/types";

export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: () => queries.getExercises(filters),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: () => queries.getExerciseById(id),
    enabled: !!id,
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: () => queries.getPrograms(),
  });
}

export function useActiveProgram() {
  return useQuery({
    queryKey: ["programs", "active"],
    queryFn: () => queries.getActiveProgram(),
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => queries.getProgramById(id),
    enabled: !!id,
  });
}

export function useWorkoutLogs(limit?: number) {
  return useQuery({
    queryKey: ["workout-logs", limit],
    queryFn: () => queries.getWorkoutLogs(limit),
  });
}

export function useWorkoutLog(id: string) {
  return useQuery({
    queryKey: ["workout-log", id],
    queryFn: () => queries.getWorkoutLogById(id),
    enabled: !!id,
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise-history", exerciseId],
    queryFn: () => queries.getExerciseHistory(exerciseId),
    enabled: !!exerciseId,
  });
}

export function useBodyMeasurements() {
  return useQuery({
    queryKey: ["body-measurements"],
    queryFn: () => queries.getBodyMeasurements(),
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ["personal-records"],
    queryFn: () => queries.getPersonalRecords(),
  });
}

export function useCardioSessions() {
  return useQuery({
    queryKey: ["cardio-sessions"],
    queryFn: () => queries.getCardioSessions(),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => queries.getDashboardStats(),
  });
}

export function useCreateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkoutLog, "id">) => queries.createWorkoutLog(data),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutLog> }) =>
      queries.updateWorkoutLog(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCreateCardioSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CardioSession, "id">) => queries.createCardioSession(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cardio-sessions"] });
    },
  });
}

export function useLogBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BodyMeasurement, "id">) => queries.logBodyMeasurement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
