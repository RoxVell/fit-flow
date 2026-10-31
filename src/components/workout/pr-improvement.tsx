import { TrendingUp } from "lucide-react";
import type { PersonalRecord } from "@/lib/db/types";
import { getPrImprovement } from "@/lib/workout/pr-improvement";

export function PrImprovement({ record, history, unit }: {
  record: PersonalRecord;
  history: PersonalRecord[];
  unit: string;
}) {
  const improvement = getPrImprovement(record, history);
  if (!improvement) return null;
  return (
    <p className="mt-0.5 flex flex-wrap items-center justify-end gap-0.5 text-[11px] text-green-500 tabular-nums">
      <TrendingUp className="h-3 w-3" />
      +{improvement.absolute.toFixed(2)} {unit}
      {improvement.percent !== null && (
        <span className="text-green-500/70">(+{improvement.percent.toFixed(1)}%)</span>
      )}
    </p>
  );
}
