"use client";

import { ExerciseChart } from "@/components/progress/exercise-chart";
import { WeightChart } from "@/components/progress/weight-chart";

export default function ProgressPage() {
  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-bold">Progress</h1>
      <ExerciseChart />
      <WeightChart />
    </div>
  );
}
