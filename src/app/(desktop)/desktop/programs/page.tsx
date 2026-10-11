"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Library, Timer } from "lucide-react";
import { PageHeader } from "@/components/desktop/page-header";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonBlock,
  Tag,
} from "@/components/desktop/ui";
import { usePrograms } from "@/lib/hooks/use-data";
import { getDayLabels } from "@/lib/i18n/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const dt = useDt();
  const locale = useLocale();
  const programs = usePrograms();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dayLabels = getDayLabels(locale);

  const selected = useMemo(() => {
    if (!programs || programs.length === 0) return null;
    return (
      programs.find((program) => program.id === selectedId) ??
      programs.find((program) => program.isActive) ??
      programs[0]
    );
  }, [programs, selectedId]);

  if (!programs) {
    return (
      <div className="grid gap-4 xl:grid-cols-12">
        <SkeletonBlock className="h-96 xl:col-span-4" />
        <SkeletonBlock className="h-96 xl:col-span-8" />
      </div>
    );
  }

  return (
    <div className="desk-enter">
      <PageHeader title={dt.nav.programs} description={dt.subtitles.programs} />

      {programs.length === 0 ? (
        <Panel>
          <EmptyState icon={Library} title={dt.programs.empty} />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-4">
            <PanelHeader
              icon={Library}
              title={dt.nav.programs}
              hint={programs.length + ""}
            />
            <ul className="desk-scroll max-h-[36rem] overflow-y-auto">
              {programs.map((program) => (
                <li key={program.id}>
                  <button
                    type="button"
                    data-selected={selected?.id === program.id}
                    onClick={() => setSelectedId(program.id)}
                    className="desk-row w-full border-b border-[var(--desk-line)] px-4 py-3 text-left last:border-0 hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {program.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold",
                          program.isActive
                            ? "bg-emerald-500/12 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {program.isActive ? dt.programs.active : dt.programs.inactive}
                      </span>
                    </div>
                    <p className="desk-num mt-1 text-[0.6875rem] text-muted-foreground">
                      {program.daysPerWeek} {dt.programs.daysPerWeek} ·{" "}
                      {program.sessions.length} {dt.programs.sessionCount}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="xl:col-span-8">
            {selected ? (
              <Panel accent>
                <PanelHeader
                  icon={CalendarDays}
                  title={selected.name}
                  hint={selected.description || undefined}
                  action={
                    selected.restDurationSeconds ? (
                      <Tag>
                        <Timer className="size-3" />
                        {dt.programs.rest} {selected.restDurationSeconds}s
                      </Tag>
                    ) : null
                  }
                />
                <PanelBody className="desk-scroll max-h-[36rem] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {[...selected.sessions]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((session) => (
                        <div
                          key={session.id}
                          className="rounded-xl border border-[var(--desk-line)] bg-background/40"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-[var(--desk-line)] px-3 py-2">
                            <span className="truncate text-xs font-semibold">
                              {session.name}
                            </span>
                            <Tag>{dayLabels[session.dayOfWeek] ?? "—"}</Tag>
                          </div>
                          <ul className="divide-y divide-[var(--desk-line)]">
                            {[...session.exercises]
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map((exercise, position) => (
                                <li
                                  key={exercise.id}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs"
                                >
                                  <span className="desk-num w-4 shrink-0 text-muted-foreground">
                                    {position + 1}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">
                                    {exercise.exercise?.name ?? exercise.exerciseId}
                                  </span>
                                  <span className="desk-num shrink-0 text-[0.6875rem] text-muted-foreground">
                                    {exercise.targetReps
                                      ? exercise.targetSets + " × " + exercise.targetReps
                                      : exercise.targetSets + " " + dt.units.sets}
                                  </span>
                                </li>
                              ))}
                            {session.exercises.length === 0 && (
                              <li className="px-3 py-2 text-[0.6875rem] text-muted-foreground">
                                {dt.panels.noData}
                              </li>
                            )}
                          </ul>
                        </div>
                      ))}
                  </div>
                </PanelBody>
              </Panel>
            ) : (
              <Panel>
                <EmptyState icon={Library} title={dt.programs.selectHint} />
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
