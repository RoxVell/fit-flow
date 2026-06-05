"use client";

import { useExerciseHistory } from "@/lib/hooks/use-data";
import { TrendingUp } from "lucide-react";

interface PreviousResultsProps {
  exerciseId: string;
}

export function PreviousResults({ exerciseId }: PreviousResultsProps) {
  const history = useExerciseHistory(exerciseId);

  if (!history || history.length === 0) return null;

  const last = history[history.length - 1];

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <TrendingUp className="h-3 w-3" />
      <span>
        Last time: {last.maxWeight} kg × {last.volume > 0 ? `${last.volume} vol` : "—"}
      </span>
      {last.estimated1RM > 0 && (
        <span className="font-medium text-primary">
          e1RM: {last.estimated1RM} kg
        </span>
      )}
    </div>
  );
}
