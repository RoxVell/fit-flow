"use client";

import { ExerciseChart } from "@/components/progress/exercise-chart";
import { WeightChart } from "@/components/progress/weight-chart";

export default function ProgressPage() {
  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-xl font-bold">Progress</h1>
      <ExerciseChart />
      <WeightChart />
    </div>
  );
}
