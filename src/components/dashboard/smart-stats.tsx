"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";

interface SmartStatsProps {
  steps: number;
  calories: number;
  weight: number | null;
  weightTrend: "up" | "down" | "stable";
  hasWeightHistory: boolean;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function SmartStats({
  steps,
  calories,
  weight,
  weightTrend,
  hasWeightHistory,
}: SmartStatsProps) {
  const t = useT();
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-card p-3 shadow-sm border">
        <p className="text-xs text-muted-foreground">{t.dashboard.steps}</p>
        <p className="text-lg font-bold">{steps.toLocaleString()}</p>
      </div>
      <div className="rounded-xl bg-card p-3 shadow-sm border">
        <p className="text-xs text-muted-foreground">{t.dashboard.calories}</p>
        <p className="text-lg font-bold">{calories}</p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/progress/body/log")}
        className="rounded-xl bg-card p-3 shadow-sm border text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{t.dashboard.weight}</p>
          {hasWeightHistory && <TrendIcon trend={weightTrend} />}
        </div>
        <p className="text-lg font-bold">
          {weight != null ? (
            <>
              {weight} {t.dashboard.kg}
            </>
          ) : (
            "—"
          )}
        </p>
      </button>
    </div>
  );
}
