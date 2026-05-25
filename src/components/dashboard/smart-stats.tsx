"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SmartStatsProps {
  steps: number;
  calories: number;
  weight: number;
  weightTrend: "up" | "down" | "stable";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function SmartStats({ steps, calories, weight, weightTrend }: SmartStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-card p-3 shadow-sm border">
        <p className="text-xs text-muted-foreground">Steps</p>
        <p className="text-lg font-bold">{steps.toLocaleString()}</p>
      </div>
      <div className="rounded-xl bg-card p-3 shadow-sm border">
        <p className="text-xs text-muted-foreground">Calories</p>
        <p className="text-lg font-bold">{calories}</p>
      </div>
      <div className="rounded-xl bg-card p-3 shadow-sm border">
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">Weight</p>
          <TrendIcon trend={weightTrend} />
        </div>
        <p className="text-lg font-bold">{weight} kg</p>
      </div>
    </div>
  );
}
