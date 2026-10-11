"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Clock,
  Dumbbell,
  Flame,
  Gauge,
  Hash,
  Layers,
  Target,
  TrendingUp,
  Trophy,
  Weight,
} from "lucide-react";
import { PageHeader, RANGE_OPTIONS, type RangeDays } from "@/components/desktop/page-header";
import {
  EmptyState,
  MetricRow,
  Panel,
  PanelBody,
  PanelHeader,
  Segmented,
  SkeletonBlock,
  StatTile,
} from "@/components/desktop/ui";
import { LoadChart } from "@/components/desktop/charts/load-chart";
import { MuscleRadar } from "@/components/desktop/charts/muscle-radar";
import { ConsistencyHeatmap } from "@/components/desktop/charts/consistency-heatmap";
import { SessionsTable } from "@/components/desktop/panels/sessions-table";
import { RecordsList } from "@/components/desktop/panels/records-list";
import { TopExercisesTable } from "@/components/desktop/panels/top-exercises";
import { useDesktopAnalytics, useAllWorkoutLogs } from "@/lib/desktop/use-desktop-data";
import { useActiveProgram, usePersonalRecords } from "@/lib/hooks/use-data";
import { sortRecords } from "@/lib/desktop/analytics";
import { formatCompact, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";

export default function OverviewPage() {
  const dt = useDt();
  const locale = useLocale();
  const router = useRouter();
  const [range, setRange] = useState<RangeDays>(30);

  const analytics = useDesktopAnalytics(range);
  const logs = useAllWorkoutLogs();
  const records = usePersonalRecords();
  const program = useActiveProgram();

  const rangeOptions = useMemo(
    () =>
      RANGE_OPTIONS.map((days) => ({
        value: days,
        label:
          days === 7
            ? dt.range.d7
            : days === 30
              ? dt.range.d30
              : days === 90
                ? dt.range.d90
                : dt.range.d365,
      })),
    [dt]
  );

  if (!analytics || !logs) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <SkeletonBlock className="h-80 w-full" />
      </div>
    );
  }

  if (analytics.totalWorkouts === 0) {
    return (
      <>
        <PageHeader title={dt.nav.overview} description={dt.subtitles.overview} />
        <Panel className="desk-enter">
          <EmptyState
            icon={Dumbbell}
            title={dt.empty.title}
            description={dt.empty.description}
            action={
              <Link
                href="/workout"
                className="mt-2 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
              >
                {dt.empty.cta}
              </Link>
            }
          />
        </Panel>
      </>
    );
  }

  const { kpis, weekly, muscles, calendar, streaks, exercises } = analytics;

  return (
    <div className="desk-enter">
      <PageHeader
        title={dt.nav.overview}
        description={dt.subtitles.overview}
        actions={
          <Segmented value={range} onChange={setRange} options={rangeOptions} />
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          accent
          icon={Activity}
          label={dt.kpi.workouts}
          value={formatNumber(kpis.workouts.current, locale)}
          delta={kpis.workouts}
          caption={dt.kpi.vsPrev}
        />
        <StatTile
          icon={Weight}
          label={dt.kpi.volume}
          value={formatCompact(kpis.volume.current, locale)}
          unit={dt.units.kg}
          delta={kpis.volume}
          caption={dt.kpi.vsPrev}
        />
        <StatTile
          icon={Layers}
          label={dt.kpi.sets}
          value={formatNumber(kpis.sets.current, locale)}
          delta={kpis.sets}
        />
        <StatTile
          icon={Hash}
          label={dt.kpi.reps}
          value={formatNumber(kpis.reps.current, locale)}
          delta={kpis.reps}
        />
        <StatTile
          icon={Clock}
          label={dt.kpi.duration}
          value={kpis.duration.current || "—"}
          unit={dt.units.min}
          delta={kpis.duration}
        />
        <StatTile
          icon={Gauge}
          label={dt.kpi.intensity}
          value={formatNumber(kpis.intensity.current, locale, 1)}
          unit={dt.units.perRep}
          delta={kpis.intensity}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel accent className="xl:col-span-8">
          <PanelHeader
            icon={TrendingUp}
            title={dt.panels.volumeTrend}
            hint={dt.panels.volumeTrendHint}
          />
          <PanelBody className="flex min-h-[18rem] flex-col">
            <LoadChart data={weekly} fill />
          </PanelBody>
        </Panel>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <Panel>
            <PanelHeader icon={Flame} title={dt.panels.streak} />
            <PanelBody className="py-1">
              <MetricRow label={dt.streak.currentWeeks} value={streaks.currentWeeks} />
              <MetricRow label={dt.streak.longestWeeks} value={streaks.longestWeeks} />
              <MetricRow label={dt.streak.currentDays} value={streaks.currentDays} />
              <MetricRow label={dt.streak.longestDays} value={streaks.longestDays} />
            </PanelBody>
          </Panel>

          <Panel className="flex-1">
            <PanelHeader
              icon={Target}
              title={dt.panels.muscleSplit}
              hint={dt.panels.muscleSplitHint}
            />
            <PanelBody className="pt-0">
              <MuscleRadar data={muscles} />
            </PanelBody>
          </Panel>
        </div>

        <Panel className="xl:col-span-12">
          <PanelHeader
            icon={CalendarDays}
            title={dt.panels.consistency}
            hint={dt.panels.consistencyHint}
          />
          <PanelBody>
            <ConsistencyHeatmap data={calendar} />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-7">
          <PanelHeader
            icon={Activity}
            title={dt.panels.recentSessions}
            action={
              <Link
                href="/desktop/sessions"
                className="text-xs font-medium text-primary hover:underline"
              >
                {dt.panels.viewAll}
              </Link>
            }
          />
          <div className="overflow-hidden">
            <SessionsTable
              logs={logs.slice(0, 7)}
              onSelect={(id) => router.push("/desktop/sessions?id=" + id)}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <Panel>
            <PanelHeader icon={Trophy} title={dt.panels.records} />
            <RecordsList records={sortRecords(records ?? [])} limit={5} />
          </Panel>

          <Panel className="flex-1">
            <PanelHeader
              icon={Dumbbell}
              title={dt.panels.program}
              action={
                <Link
                  href="/desktop/programs"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {dt.panels.viewAll}
                </Link>
              }
            />
            <PanelBody>
              {program ? (
                <div>
                  <p className="text-sm font-semibold">{program.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {program.daysPerWeek} {dt.programs.daysPerWeek} ·{" "}
                    {program.sessions.length} {dt.programs.sessionCount}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {program.sessions.slice(0, 5).map((session) => (
                      <li
                        key={session.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--desk-line)] bg-background/40 px-2.5 py-1.5"
                      >
                        <span className="truncate text-xs font-medium">
                          {session.name}
                        </span>
                        <span className="desk-num shrink-0 text-[0.625rem] text-muted-foreground">
                          {session.exercises.length} {dt.programs.exerciseCount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {dt.panels.noProgram}
                </p>
              )}
            </PanelBody>
          </Panel>
        </div>

        <Panel className="xl:col-span-12">
          <PanelHeader
            icon={Dumbbell}
            title={dt.panels.topExercises}
            action={
              <Link
                href="/desktop/exercises"
                className="text-xs font-medium text-primary hover:underline"
              >
                {dt.panels.viewAll}
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <TopExercisesTable
              rows={exercises.slice(0, 8)}
              onSelect={(id) => router.push("/desktop/exercises?id=" + id)}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
