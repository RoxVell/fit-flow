"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, Download, Pencil, Trash2 } from "lucide-react";
import {
  useCompletedWorkoutLogs,
  useCompletedWorkoutLogsCount,
} from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { formatDuration } from "@/lib/utils/calculations";
import { volume } from "@/lib/training-metrics";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/stores/locale-store";
import {
  getCompletedWorkoutLogsInRange,
  removeWorkoutLog,
} from "@/lib/repositories/workouts";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { WorkoutEditSheet } from "@/components/workout/workout-edit-sheet";
import {
  buildWorkoutLogsCsv,
  createWorkoutExportRange,
  getWorkoutExportFilename,
  type WorkoutExportPreset,
} from "@/lib/workout/export-csv";

const PAGE_SIZE = 20;
const PREVIEW_LIMIT = 5;

const WORKOUT_ROW_GRID =
  "grid grid-cols-[4.25rem_minmax(0,1fr)_2.75rem_5.25rem_1rem] items-center gap-2";

const EXPORT_PRESETS: WorkoutExportPreset[] = ["1m", "3m", "6m", "custom"];

function getDurationMinutes(startedAt: string, endedAt?: string) {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

function atStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function atEndOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function WorkoutHistory({ preview = false }: { preview?: boolean } = {}) {
  const t = useT();
  const locale = useLocale();
  const { formatShortDate } = useFormat();
  const { getName } = useExerciseLookup();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const logs = useCompletedWorkoutLogs(preview ? PREVIEW_LIMIT : limit);
  const totalCount = useCompletedWorkoutLogsCount();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<WorkoutLogEntity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportPreset, setExportPreset] = useState<WorkoutExportPreset>("1m");
  const [exportFrom, setExportFrom] = useState(
    () => createWorkoutExportRange("1m").from
  );
  const [exportTo, setExportTo] = useState(
    () => createWorkoutExportRange("1m").to
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore =
    !preview &&
    logs !== undefined &&
    totalCount !== undefined &&
    logs.length < totalCount;

  const loadMore = useCallback(() => {
    setLimit((n) => n + PAGE_SIZE);
  }, []);

  const handlePresetChange = (preset: WorkoutExportPreset) => {
    setExportPreset(preset);
    setExportError(null);
    if (preset === "custom") return;
    const range = createWorkoutExportRange(preset);
    setExportFrom(range.from);
    setExportTo(range.to);
  };

  const handleExport = () => {
    if (exporting) return;
    const from = atStartOfDay(exportFrom);
    const to = atEndOfDay(exportTo);
    if (from.getTime() > to.getTime()) {
      setExportError(t.workout.exportInvalidRange);
      return;
    }
    setExporting(true);
    setExportError(null);
    void getCompletedWorkoutLogsInRange(from, to)
      .then((exportLogs) => {
        if (exportLogs.length === 0) {
          setExportError(t.workout.exportEmpty);
          return;
        }
        const range = { from, to };
        downloadCsv(getWorkoutExportFilename(range), buildWorkoutLogsCsv(exportLogs));
      })
      .catch((err) => {
        console.warn("[workout-history] export failed", err);
        setExportError(t.workout.exportFailed);
      })
      .finally(() => setExporting(false));
  };

  useEffect(() => {
    if (preview) return;
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, preview]);

  if (logs === undefined) {
    if (preview) return null;
    return (
      <div className="space-y-2">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (logs.length === 0) {
    if (preview) return null;
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-4 py-12 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t.workout.noHistory}</p>
      </div>
    );
  }

  const deleteTarget = deleteId
    ? logs.find((l) => l.id === deleteId)
    : undefined;

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-2 p-4 pb-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">
            {preview ? t.dashboard.recentWorkouts : t.workout.historyTitle}
          </h2>
        </div>
        {!preview && (
        <div className="space-y-3 px-4 pb-4">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t.workout.exportCsv}
            </p>
            <div
              className="flex w-full items-center rounded-lg border bg-muted/50 p-0.5"
              role="group"
              aria-label={t.workout.exportPeriod}
            >
              {EXPORT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetChange(preset)}
                  className={cn(
                    "min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                    exportPreset === preset
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.workout.exportPresets[preset]}
                </button>
              ))}
            </div>
            {exportPreset === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {t.workout.exportFrom}
                  </label>
                  <DatePicker
                    value={exportFrom}
                    locale={locale}
                    onChange={(date) => {
                      setExportPreset("custom");
                      setExportFrom(atStartOfDay(date));
                      setExportError(null);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {t.workout.exportTo}
                  </label>
                  <DatePicker
                    value={exportTo}
                    locale={locale}
                    onChange={(date) => {
                      setExportPreset("custom");
                      setExportTo(atEndOfDay(date));
                      setExportError(null);
                    }}
                  />
                </div>
              </div>
            )}
            {exportError && (
              <p className="text-xs text-destructive">{exportError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="w-full gap-1.5"
            >
              <Download className="h-4 w-4" />
              {exporting ? t.workout.exporting : t.workout.exportCsv}
            </Button>
          </div>
        </div>
        )}
        <div
          className={cn(
            WORKOUT_ROW_GRID,
            "border-b px-4 py-2 text-xs text-muted-foreground"
          )}
        >
          <span>{t.dashboard.date}</span>
          <span className="min-w-0 truncate">{t.dashboard.session}</span>
          <span className="text-right">{t.dashboard.time}</span>
          <span className="text-right">{t.dashboard.volume}</span>
          <span />
        </div>
        <div className="divide-y divide-border/50">
          {logs.map((log) => {
            const duration = getDurationMinutes(log.startedAt, log.endedAt);
            const totalVolume = log.exercises.reduce(
              (sum, e) => sum + volume(e.sets.filter((s) => s.completed)),
              0
            );
            const isOpen = expandedId === log.id;

            return (
              <div key={log.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : log.id)}
                  className={cn(
                    WORKOUT_ROW_GRID,
                    "w-full px-4 py-2.5 text-left text-sm hover:bg-muted/20"
                  )}
                >
                  <span className="truncate text-muted-foreground">
                    {formatShortDate(log.startedAt)}
                  </span>
                  <span className="truncate font-medium">
                    {log.sessionName || t.dashboard.workoutFallback}
                  </span>
                  <span className="whitespace-nowrap text-right text-muted-foreground">
                    {duration != null
                      ? formatDuration(duration)
                      : t.common.emDash}
                  </span>
                  <span className="whitespace-nowrap text-right font-medium tabular-nums">
                    {totalVolume > 0
                      ? `${Math.round(totalVolume)} ${t.dashboard.kg}`
                      : t.common.emDash}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-200",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-3 border-t border-border/50 px-4 py-3">
                      {log.exercises.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {t.workout.noCompletedSets}
                        </p>
                      ) : (
                        log.exercises
                          .filter((exercise) =>
                            exercise.sets.some((s) => s.completed)
                          )
                          .map((exercise) => {
                            const completedSets = exercise.sets
                              .filter((s) => s.completed)
                              .sort((a, b) => a.setOrder - b.setOrder);

                            return (
                              <div key={exercise.id}>
                                <p className="mb-1 text-xs font-medium">
                                  {getName(exercise.exerciseId)}
                                </p>
                                <div className="space-y-0.5 pl-2">
                                  {completedSets.map((set, index) => (
                                    <div
                                      key={set.id}
                                      className="grid grid-cols-[auto_1fr] gap-2 text-xs text-muted-foreground"
                                    >
                                      <span className="w-4 text-right tabular-nums text-muted-foreground/40">
                                        {index + 1}
                                      </span>
                                      <span className="tabular-nums text-foreground">
                                        {set.weight} {t.dashboard.kg} ×{" "}
                                        {set.reps}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                      )}
                      {!preview && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => setEditingLog(log)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t.workout.editWorkout}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(log.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t.workout.deleteWorkout}
                        </Button>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {preview ? (
          <div className="border-t px-4 py-3">
            <Link
              href="/workout?tab=history"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              {t.dashboard.viewAllWorkouts}
            </Link>
          </div>
        ) : (
          hasMore && (
          <div ref={sentinelRef} className="px-4 py-3">
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          )
        )}
      </div>

      {!preview && (
      <>
      <WorkoutEditSheet
        log={editingLog}
        open={editingLog !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLog(null);
        }}
        onSaved={() => setEditingLog(null)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title={t.workout.deleteConfirmTitle}
        description={t.workout.deleteConfirmDesc}
        confirmLabel={t.workout.deleteWorkout}
        cancelLabel={t.workout.cancel}
        pendingLabel={t.workout.deleting}
        destructive
        pending={deleting}
        onConfirm={() => {
          if (!deleteId || deleting) return;
          setDeleting(true);
          void removeWorkoutLog(deleteId)
            .then(() => {
              setDeleteId(null);
              if (expandedId === deleteId) setExpandedId(null);
            })
            .catch((err) => {
              console.warn("[workout-history] delete failed", err);
            })
            .finally(() => {
              setDeleting(false);
            });
        }}
      >
        {deleteTarget && (
          <p className="text-sm text-muted-foreground">
            {deleteTarget.sessionName || t.dashboard.workoutFallback} ·{" "}
            {formatShortDate(deleteTarget.startedAt)}
          </p>
        )}
      </ConfirmDialog>
      </>
      )}
    </>
  );
}
