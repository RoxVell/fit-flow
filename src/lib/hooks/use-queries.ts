"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useExercises(filters?: Parameters<typeof api.getExercises>[0]) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: () => api.getExercises(filters),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: () => api.getExerciseById(id),
    enabled: !!id,
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: () => api.getPrograms(),
  });
}

export function useActiveProgram() {
  return useQuery({
    queryKey: ["programs", "active"],
    queryFn: () => api.getActiveProgram(),
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => api.getProgramById(id),
    enabled: !!id,
  });
}

export function useWorkoutLogs(limit?: number) {
  return useQuery({
    queryKey: ["workout-logs", limit],
    queryFn: () => api.getWorkoutLogs(limit),
  });
}

export function useWorkoutLog(id: string) {
  return useQuery({
    queryKey: ["workout-log", id],
    queryFn: () => api.getWorkoutLogById(id),
    enabled: !!id,
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise-history", exerciseId],
    queryFn: () => api.getExerciseHistory(exerciseId),
    enabled: !!exerciseId,
  });
}

export function useExerciseDetailedHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise-detailed-history", exerciseId],
    queryFn: () => api.getExerciseDetailedHistory(exerciseId),
    enabled: !!exerciseId,
  });
}

export function useBodyMeasurements() {
  return useQuery({
    queryKey: ["body-measurements"],
    queryFn: () => api.getBodyMeasurements(),
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ["personal-records"],
    queryFn: () => api.getPersonalRecords(),
  });
}

export function useCardioSessions() {
  return useQuery({
    queryKey: ["cardio-sessions"],
    queryFn: () => api.getCardioSessions(),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
  });
}

export function useCreateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkoutLog,
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.updateWorkoutLog>[1];
    }) => api.updateWorkoutLog(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorkoutLog,
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
    mutationFn: api.createProgram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["programs", "active"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.updateProgram>[1];
    }) => api.updateProgram(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["programs", "active"] });
    },
  });
}

export function useCreateCardioSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCardioSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cardio-sessions"] });
    },
  });
}

export function useLogBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logBodyMeasurement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCreatePersonalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPersonalRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personal-records"] });
    },
  });
}
