"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";

interface HistorySet {
  weight: number;
  reps: number;
  type: string;
  setOrder: number;
}

interface HistorySession {
  date: string;
  bestE1RM: number;
  excludeFromStats?: boolean;
  notes?: string;
  sets: HistorySet[];
}

interface HistoryAccordionProps {
  sessions: HistorySession[];
}

export function HistoryAccordion({ sessions }: HistoryAccordionProps) {
  const t = useT();
  const { formatHistoryDate } = useFormat();
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const setTypeLabel = useMemo(
    () => ({
      working: "",
      warmup: t.progress.warmupSet,
      dropset: t.progress.dropsetSet,
    }),
    [t]
  );

  const toggle = useCallback((i: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const allOpen = sessions.length > 0 && openSet.size === sessions.length;

  const toggleAll = useCallback(() => {
    if (allOpen) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(sessions.map((_, i) => i)));
    }
  }, [allOpen, sessions]);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.progress.history}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t.progress.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{t.progress.history}</CardTitle>
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allOpen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" /> {t.progress.collapseAll}
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" /> {t.progress.expandAll}
              </>
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {sorted.map((session, i) => {
            const isOpen = openSet.has(i);
            const excluded = Boolean(session.excludeFromStats);
            let prevBest: number | null = null;
            if (!excluded) {
              for (let k = i + 1; k < sorted.length; k++) {
                if (!sorted[k].excludeFromStats) {
                  prevBest = sorted[k].bestE1RM;
                  break;
                }
              }
            }
            const delta = prevBest !== null ? session.bestE1RM - prevBest : null;

            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatHistoryDate(session.date)}
                    </span>
                    {excluded && (
                      <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t.workout.excludedFromStats}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        excluded && "text-muted-foreground"
                      )}
                    >
                      {session.bestE1RM.toFixed(1)} {t.dashboard.kg}
                    </span>
                    {delta !== null && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-xs font-medium tabular-nums",
                          delta > 0
                            ? "text-green-500"
                            : delta < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                        )}
                      >
                        {delta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : delta < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-200",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-0.5 px-4 pb-3 pl-9">
                      {session.notes ? (
                        <p className="mb-1.5 text-xs italic text-muted-foreground">
                          {session.notes}
                        </p>
                      ) : null}
                      {session.sets
                        .sort((a, b) => a.setOrder - b.setOrder)
                        .map((s, j) => (
                          <div
                            key={j}
                            className={cn(
                              "grid grid-cols-[auto_1fr_auto] gap-2 text-xs",
                              s.type === "warmup"
                                ? "text-muted-foreground/50"
                                : s.type === "dropset"
                                  ? "text-muted-foreground/70"
                                  : "text-foreground"
                            )}
                          >
                            <span className="w-4 text-right tabular-nums text-muted-foreground/30">
                              {s.setOrder + 1}
                            </span>
                            <span className="tabular-nums">
                              {s.weight} {t.dashboard.kg} × {s.reps}
                            </span>
                            {setTypeLabel[s.type as keyof typeof setTypeLabel] && (
                              <span className="text-[10px] text-muted-foreground/40 italic">
                                {setTypeLabel[s.type as keyof typeof setTypeLabel]}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
