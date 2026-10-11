"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Gauge,
  PieChart,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  PageHeader,
  RANGE_OPTIONS,
  type RangeDays,
} from "@/components/desktop/page-header";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  Segmented,
  SkeletonBlock,
} from "@/components/desktop/ui";
import { LoadChart } from "@/components/desktop/charts/load-chart";
import { MuscleRadar } from "@/components/desktop/charts/muscle-radar";
import { DistributionBars } from "@/components/desktop/charts/distribution-bars";
import { RhythmGrid } from "@/components/desktop/charts/rhythm-grid";
import { StrengthChart } from "@/components/desktop/charts/strength-chart";
import { TopExercisesTable } from "@/components/desktop/panels/top-exercises";
import { useAllWorkoutLogs, useDesktopAnalytics } from "@/lib/desktop/use-desktop-data";
import { buildExerciseTimeline } from "@/lib/desktop/analytics";
import { useDt } from "@/lib/i18n/use-dt";

export default function AnalyticsPage() {
  const dt = useDt();
  const [range, setRange] = useState<RangeDays>(90);
  const [exerciseId, setExerciseId] = useState<string | null>(null);

  const analytics = useDesktopAnalytics(range);
  const logs = useAllWorkoutLogs();

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

  const selectedId = exerciseId ?? analytics?.exercises[0]?.exerciseId ?? null;

  const timeline = useMemo(() => {
    if (!logs || !selectedId) return [];
    return buildExerciseTimeline(logs, selectedId);
  }, [logs, selectedId]);

  if (!analytics || !logs) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    );
  }

  if (analytics.totalWorkouts === 0) {
    return (
      <>
        <PageHeader title={dt.nav.analytics} description={dt.subtitles.analytics} />
        <Panel>
          <EmptyState
            icon={BarChart3}
            title={dt.empty.title}
            description={dt.empty.description}
          />
        </Panel>
      </>
    );
  }

  const strengthOptions = analytics.exercises
    .filter((row) => row.bestE1rm > 0)
    .slice(0, 8);

  return (
    <div className="desk-enter">
      <PageHeader
        title={dt.nav.analytics}
        description={dt.subtitles.analytics}
        actions={<Segmented value={range} onChange={setRange} options={rangeOptions} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel accent className="xl:col-span-12">
          <PanelHeader
            icon={TrendingUp}
            title={dt.panels.volumeTrend}
            hint={dt.panels.volumeTrendHint}
          />
          <PanelBody>
            <LoadChart data={analytics.weekly} height={300} />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-6">
          <PanelHeader
            icon={Gauge}
            title={dt.panels.intensityTrend}
            hint={dt.units.perRep}
          />
          <PanelBody>
            <LoadChart data={analytics.weekly} height={220} secondary="intensity" />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-6">
          <PanelHeader icon={Clock} title={dt.panels.sessionLength} hint={dt.units.min} />
          <PanelBody>
            <LoadChart data={analytics.weekly} height={220} secondary="duration" />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHeader
            icon={Target}
            title={dt.panels.muscleSplit}
            hint={dt.panels.muscleSplitHint}
          />
          <PanelBody className="pt-0">
            <MuscleRadar data={analytics.muscles} height={280} />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelHeader icon={PieChart} title={dt.panels.distribution} />
          <PanelBody>
            <DistributionBars data={analytics.muscles} />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-3">
          <PanelHeader
            icon={Activity}
            title={dt.panels.rhythm}
            hint={dt.panels.rhythmHint}
          />
          <PanelBody>
            <RhythmGrid data={analytics.rhythm} />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-12">
          <PanelHeader
            icon={TrendingUp}
            title={dt.panels.strength}
            hint={dt.panels.strengthHint}
            action={
              strengthOptions.length > 0 ? (
                <select
                  value={selectedId ?? ""}
                  onChange={(event) => setExerciseId(event.target.value)}
                  className="h-8 max-w-[16rem] rounded-lg border border-[var(--desk-line)] bg-background/60 px-2 text-xs outline-none focus-visible:border-primary"
                >
                  {strengthOptions.map((row) => (
                    <option key={row.exerciseId} value={row.exerciseId}>
                      {row.name}
                    </option>
                  ))}
                </select>
              ) : null
            }
          />
          <PanelBody>
            {timeline.length >= 2 ? (
              <StrengthChart data={timeline} height={280} />
            ) : (
              <EmptyState icon={TrendingUp} title={dt.panels.noData} />
            )}
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-12">
          <PanelHeader icon={BarChart3} title={dt.panels.topExercises} />
          <div className="desk-scroll max-h-[32rem] overflow-auto">
            <TopExercisesTable rows={analytics.exercises.slice(0, 25)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
