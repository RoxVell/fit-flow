"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { ListChecks, Search, Timer, Layers, Weight, Hash } from "lucide-react";
import { PageHeader } from "@/components/desktop/page-header";
import {
  DeltaBadge,
  EmptyState,
  ListKeysHint,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonBlock,
  StatTile,
  Tag,
} from "@/components/desktop/ui";
import { SessionsTable } from "@/components/desktop/panels/sessions-table";
import { useAllWorkoutLogs, useExerciseIndex } from "@/lib/desktop/use-desktop-data";
import {
  completedSets,
  exerciseBestE1rm,
  findPreviousSession,
  logDuration,
  logRepCount,
  logSetCount,
  logVolume,
  toDelta,
} from "@/lib/desktop/analytics";
import {
  useListKeyboard,
  useSelectionParam,
} from "@/lib/desktop/use-list-navigation";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import { volume } from "@/lib/training-metrics";
import { formatFullDay, formatClock, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";

function SessionsWorkspace() {
  const dt = useDt();
  const locale = useLocale();
  const logs = useAllWorkoutLogs();
  const index = useExerciseIndex();
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useSelectionParam();

  const filtered = useMemo(() => {
    if (!logs) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) =>
      ((log.sessionName ?? "") + " " + (log.programName ?? ""))
        .toLowerCase()
        .includes(needle)
    );
  }, [logs, query]);

  const selected = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    return logs.find((log) => log.id === selectedId) ?? filtered[0] ?? logs[0];
  }, [logs, filtered, selectedId]);

  const previous = useMemo(
    () => (logs && selected ? findPreviousSession(logs, selected) : null),
    [logs, selected]
  );

  // Best e1RM per exercise in the previous run, to flag what moved.
  const previousBest = useMemo(() => {
    const map = new Map<string, number>();
    for (const exercise of previous?.exercises ?? []) {
      if (exercise.excludeFromStats) continue;
      map.set(
        exercise.exerciseId,
        Math.max(map.get(exercise.exerciseId) ?? 0, exerciseBestE1rm(exercise))
      );
    }
    return map;
  }, [previous]);

  const filteredIds = useMemo(() => filtered.map((log) => log.id), [filtered]);
  useListKeyboard({
    ids: filteredIds,
    selectedId: selected?.id ?? null,
    onSelect: setSelectedId,
    listRef,
    searchRef,
  });

  if (!logs) {
    return (
      <div className="grid gap-4 xl:grid-cols-12">
        <SkeletonBlock className="h-[32rem] xl:col-span-7" />
        <SkeletonBlock className="h-[32rem] xl:col-span-5" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={ListChecks}
          title={dt.sessions.empty}
          description={dt.empty.description}
        />
      </Panel>
    );
  }

  return (
    <div className="desk-fill grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="min-h-0 xl:col-span-7">
        <PanelHeader
          icon={ListChecks}
          title={dt.nav.sessions}
          hint={filtered.length + " " + dt.units.sessions}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dt.sessions.searchPlaceholder}
                className="h-8 w-56 rounded-lg border border-[var(--desk-line)] bg-background/60 pl-7 pr-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-primary"
              />
            </div>
          }
        />
        <div
          ref={listRef}
          className="desk-scroll max-h-[38rem] min-h-0 flex-1 overflow-y-auto xl:max-h-none"
        >
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title={dt.search.noResults} />
          ) : (
            <SessionsTable
              logs={filtered}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <ListKeysHint />
      </Panel>

      <div className="min-h-0 xl:col-span-5">
        {selected ? (
          <div className="flex h-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={Weight}
                label={dt.table.volume}
                value={formatNumber(Math.round(logVolume(selected)), locale)}
                unit={dt.units.kg}
                delta={
                  previous
                    ? toDelta(logVolume(selected), logVolume(previous))
                    : undefined
                }
                caption={previous ? dt.sessions.vsLast : undefined}
              />
              <StatTile
                icon={Layers}
                label={dt.table.sets}
                value={logSetCount(selected)}
                delta={
                  previous
                    ? toDelta(logSetCount(selected), logSetCount(previous))
                    : undefined
                }
              />
              <StatTile
                icon={Hash}
                label={dt.table.reps}
                value={logRepCount(selected)}
                delta={
                  previous
                    ? toDelta(logRepCount(selected), logRepCount(previous))
                    : undefined
                }
              />
              <StatTile
                icon={Timer}
                label={dt.table.duration}
                value={logDuration(selected) ?? "—"}
                unit={dt.units.min}
              />
            </div>

            <Panel accent className="min-h-0 flex-1">
              <PanelHeader
                title={selected.sessionName ?? selected.programName ?? dt.nav.sessions}
                hint={
                  formatFullDay(selected.startedAt, locale) +
                  " · " +
                  formatClock(selected.startedAt, locale)
                }
              />
              <PanelBody className="desk-scroll max-h-[30rem] space-y-3 overflow-y-auto xl:max-h-none">
                {selected.notes && (
                  <p className="rounded-lg border border-[var(--desk-line)] bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {selected.notes}
                  </p>
                )}
                {selected.exercises.map((exercise, position) => {
                  const ref = index?.get(exercise.exerciseId);
                  const done = completedSets(exercise);
                  const best = exerciseBestE1rm(exercise);
                  const before = previousBest.get(exercise.exerciseId) ?? 0;
                  return (
                    <div
                      key={exercise.id}
                      className="rounded-xl border border-[var(--desk-line)] bg-background/40"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--desk-line)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            <span className="desk-num mr-1.5 text-muted-foreground">
                              {position + 1}.
                            </span>
                            {ref?.name ?? exercise.exercise?.name ?? exercise.exerciseId}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {ref && (
                              <Tag color={BODY_PART_CHART_COLORS[ref.bodyPart]}>
                                {dt.bodyParts[ref.bodyPart]}
                              </Tag>
                            )}
                            {exercise.excludeFromStats && (
                              <Tag className="text-amber-500">{dt.sessions.excluded}</Tag>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="desk-num text-xs font-semibold">
                            {formatNumber(Math.round(volume(done)), locale)}{" "}
                            <span className="font-normal text-muted-foreground">
                              {dt.units.kg}
                            </span>
                          </p>
                          {best > 0 && (
                            <p className="desk-num mt-0.5 flex items-center justify-end gap-1.5 text-[0.625rem] text-muted-foreground">
                              {dt.table.e1rm} {best.toFixed(1)}
                              {/* Only flag a change; a flat badge on every row is noise. */}
                              {before > 0 &&
                                !exercise.excludeFromStats &&
                                Math.abs(best - before) >= 0.05 && (
                                <DeltaBadge
                                  percent={toDelta(best, before).percent}
                                  className="px-1 py-0 text-[0.625rem]"
                                />
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <ul className="divide-y divide-[var(--desk-line)]">
                        {exercise.sets.map((set, setIndex) => (
                          <li
                            key={set.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-1.5 text-xs",
                              !set.completed && "opacity-45"
                            )}
                          >
                            <span className="desk-num w-5 text-muted-foreground">
                              {setIndex + 1}
                            </span>
                            <span className="desk-num font-medium">
                              {formatNumber(set.weight, locale, 1)} {dt.units.kg}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="desk-num font-medium">{set.reps}</span>
                            {set.type !== "working" && (
                              <Tag className="ml-1">
                                {set.type === "warmup"
                                  ? dt.sessions.warmup
                                  : dt.sessions.drop}
                              </Tag>
                            )}
                            {set.rir != null && (
                              <span className="desk-num ml-auto text-[0.625rem] text-muted-foreground">
                                RIR {set.rir}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {exercise.notes && (
                        <p className="border-t border-[var(--desk-line)] px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </PanelBody>
            </Panel>
          </div>
        ) : (
          <Panel>
            <EmptyState icon={ListChecks} title={dt.sessions.selectHint} />
          </Panel>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const dt = useDt();
  return (
    <div className="desk-enter">
      <PageHeader title={dt.nav.sessions} description={dt.subtitles.sessions} />
      <Suspense fallback={<SkeletonBlock className="h-[32rem]" />}>
        <SessionsWorkspace />
      </Suspense>
    </div>
  );
}
