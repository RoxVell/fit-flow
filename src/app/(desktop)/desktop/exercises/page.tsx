"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Dumbbell, Search, Trophy, TrendingUp, Layers, Weight } from "lucide-react";
import { PageHeader } from "@/components/desktop/page-header";
import {
  EmptyState,
  ListKeysHint,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonBlock,
  StatTile,
  Tag,
} from "@/components/desktop/ui";
import { StrengthChart } from "@/components/desktop/charts/strength-chart";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import {
  BODY_PARTS,
  buildExerciseStats,
  buildExerciseTimeline,
} from "@/lib/desktop/analytics";
import { useAllWorkoutLogs, useExerciseIndex } from "@/lib/desktop/use-desktop-data";
import {
  useListKeyboard,
  useSelectionParam,
} from "@/lib/desktop/use-list-navigation";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { pickLocalized } from "@/lib/exercises/locale";
import type { BodyPart } from "@/lib/exercises/types";
import { formatCompact, formatNumber, formatRelative } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";

function ExercisesWorkspace() {
  const dt = useDt();
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  const logs = useAllWorkoutLogs();
  const index = useExerciseIndex();

  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPart | null>(null);
  const [trainedOnly, setTrainedOnly] = useState(false);
  const [selectedId, setSelectedId] = useSelectionParam();
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const statsById = useMemo(() => {
    if (!logs || !index) return new Map<string, ReturnType<typeof buildExerciseStats>[number]>();
    return new Map(
      buildExerciseStats(logs, index).map((row) => [row.exerciseId, row])
    );
  }, [logs, index]);

  const rows = useMemo(() => {
    if (!manifest) return [];
    const needle = query.trim().toLowerCase();
    return manifest
      .map((item) => ({
        id: item.id,
        name: pickLocalized(item.name, locale),
        bodyPart: item.bodyPart,
        thumbnailUri: item.thumbnailUri,
        stats: statsById.get(item.id) ?? null,
      }))
      .filter((row) => {
        if (bodyPart && row.bodyPart !== bodyPart) return false;
        if (trainedOnly && !row.stats) return false;
        if (needle && !row.name.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a.stats?.volume ?? -1;
        const bv = b.stats?.volume ?? -1;
        if (av !== bv) return bv - av;
        return a.name.localeCompare(b.name);
      });
  }, [manifest, locale, query, bodyPart, trainedOnly, statsById]);

  const visibleRows = useMemo(() => rows.slice(0, 300), [rows]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );

  const visibleIds = useMemo(() => visibleRows.map((row) => row.id), [visibleRows]);
  useListKeyboard({
    ids: visibleIds,
    selectedId: selected?.id ?? null,
    onSelect: setSelectedId,
    listRef,
    searchRef,
  });

  const timeline = useMemo(() => {
    if (!logs || !selected) return [];
    return buildExerciseTimeline(logs, selected.id);
  }, [logs, selected]);

  if (!manifest || !logs) {
    return (
      <div className="grid gap-4 xl:grid-cols-12">
        <SkeletonBlock className="h-[34rem] xl:col-span-5" />
        <SkeletonBlock className="h-[34rem] xl:col-span-7" />
      </div>
    );
  }

  return (
    <div className="desk-fill grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel className="min-h-0 xl:col-span-5">
        <PanelHeader
          icon={Dumbbell}
          title={dt.nav.exercises}
          hint={rows.length + " / " + manifest.length}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dt.exercises.searchPlaceholder}
                className="h-8 w-52 rounded-lg border border-[var(--desk-line)] bg-background/60 pr-2 pl-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-primary"
              />
            </div>
          }
        />

        <div className="flex flex-wrap gap-1.5 border-b border-[var(--desk-line)] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setBodyPart(null)}
            className={cn(
              "rounded-md px-2 py-1 text-[0.6875rem] font-medium transition-colors",
              bodyPart === null
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {dt.exercises.allParts}
          </button>
          {BODY_PARTS.map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => setBodyPart(part === bodyPart ? null : part)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] font-medium transition-colors",
                bodyPart === part
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: BODY_PART_CHART_COLORS[part] }}
              />
              {dt.bodyParts[part]}
            </button>
          ))}
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <input
              type="checkbox"
              checked={trainedOnly}
              onChange={(event) => setTrainedOnly(event.target.checked)}
              className="size-3 accent-[var(--color-primary)]"
            />
            {dt.exercises.trainedOnly}
          </label>
        </div>

        <div className="desk-scroll max-h-[34rem] min-h-0 flex-1 overflow-y-auto xl:max-h-none">
          {rows.length === 0 ? (
            <EmptyState icon={Search} title={dt.exercises.empty} />
          ) : (
            <ul ref={listRef}>
              {visibleRows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    data-selected={selected?.id === row.id}
                    onClick={() => setSelectedId(row.id)}
                    className="desk-row flex w-full items-center gap-3 border-b border-[var(--desk-line)] px-4 py-2 text-left last:border-0 hover:bg-muted/40"
                  >
                    <span className="size-9 shrink-0 overflow-hidden rounded-lg border border-[var(--desk-line)] bg-muted/40">
                      <ExerciseThumbnail src={row.thumbnailUri} alt={row.name} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        {row.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <Tag color={BODY_PART_CHART_COLORS[row.bodyPart]}>
                          {dt.bodyParts[row.bodyPart]}
                        </Tag>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {row.stats ? (
                        <>
                          <span className="desk-num block text-xs font-semibold">
                            {formatCompact(row.stats.volume, locale)}
                            <span className="ml-1 font-normal text-muted-foreground">
                              {dt.units.kg}
                            </span>
                          </span>
                          <span className="desk-num block text-[0.625rem] text-muted-foreground">
                            {row.stats.sessions} {dt.units.sessions}
                          </span>
                        </>
                      ) : (
                        <span className="text-[0.625rem] text-muted-foreground">
                          {dt.exercises.never}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ListKeysHint />
      </Panel>

      <div className="flex min-h-0 flex-col gap-4 xl:col-span-7">
        {selected ? (
          <>
            <Panel accent>
              <PanelBody className="flex items-center gap-4">
                <span className="size-16 shrink-0 overflow-hidden rounded-xl border border-[var(--desk-line)] bg-muted/40">
                  <ExerciseThumbnail
                    src={selected.thumbnailUri}
                    alt={selected.name}
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{selected.name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Tag color={BODY_PART_CHART_COLORS[selected.bodyPart]}>
                      {dt.bodyParts[selected.bodyPart]}
                    </Tag>
                    {selected.stats?.lastPerformed && (
                      <Tag>{formatRelative(selected.stats.lastPerformed, locale)}</Tag>
                    )}
                  </div>
                </div>
              </PanelBody>
            </Panel>

            <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
              <StatTile
                icon={Trophy}
                label={dt.exercises.personalBest}
                value={
                  selected.stats?.bestWeight
                    ? formatNumber(selected.stats.bestWeight, locale, 1)
                    : "—"
                }
                unit={dt.units.kg}
              />
              <StatTile
                icon={TrendingUp}
                label={dt.table.e1rm}
                value={
                  selected.stats?.bestE1rm
                    ? formatNumber(selected.stats.bestE1rm, locale, 1)
                    : "—"
                }
                unit={dt.units.kg}
              />
              <StatTile
                icon={Weight}
                label={dt.exercises.totalVolume}
                value={
                  selected.stats ? formatCompact(selected.stats.volume, locale) : "—"
                }
                unit={dt.units.kg}
              />
              <StatTile
                icon={Layers}
                label={dt.exercises.sessionCount}
                value={selected.stats?.sessions ?? 0}
                caption={
                  selected.stats ? selected.stats.sets + " " + dt.units.sets : undefined
                }
              />
            </div>

            <Panel className="min-h-[18rem] flex-1">
              <PanelHeader
                icon={TrendingUp}
                title={dt.exercises.history}
                hint={dt.panels.strengthHint}
              />
              <PanelBody className="flex flex-col">
                {timeline.length >= 2 ? (
                  <StrengthChart data={timeline} fill />
                ) : (
                  <EmptyState icon={Dumbbell} title={dt.exercises.noHistory} />
                )}
              </PanelBody>
            </Panel>
          </>
        ) : (
          <Panel>
            <EmptyState icon={Dumbbell} title={dt.exercises.selectHint} />
          </Panel>
        )}
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  const dt = useDt();
  return (
    <div className="desk-enter">
      <PageHeader title={dt.nav.exercises} description={dt.subtitles.exercises} />
      <Suspense fallback={<SkeletonBlock className="h-[34rem]" />}>
        <ExercisesWorkspace />
      </Suspense>
    </div>
  );
}
