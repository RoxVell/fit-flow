"use client";

import BodyModel from "react-body-highlighter";
import type { Muscle } from "react-body-highlighter";
import type { MuscleGroup } from "@/lib/db/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/use-t";

interface MuscleHeatmapProps {
  data: Partial<Record<MuscleGroup, number>>;
}

const muscleMap: Partial<Record<MuscleGroup, Muscle>> = {
  chest: "chest",
  back: "upper-back",
  shoulders: "front-deltoids",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  quads: "quadriceps",
  hamstrings: "hamstring",
  glutes: "gluteal",
  calves: "calves",
  abs: "abs",
  traps: "trapezius",
};

export function MuscleHeatmap({ data }: MuscleHeatmapProps) {
  const t = useT();
  const exercises = Object.entries(data)
    .map(([muscle, freq]) => {
      if (!freq || freq <= 0) return null;
      const mapped = muscleMap[muscle as MuscleGroup];
      return mapped ? { name: muscle, muscles: [mapped], frequency: freq } : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t.dashboard.muscleLoad}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-2">
          {(["anterior", "posterior"] as const).map((side) => (
            <BodyModel
              key={side}
              type={side}
              data={exercises}
              bodyColor="var(--color-muted)"
              highlightedColors={["#fde68a", "#fb923c", "#f97316", "#ea580c"]}
              svgStyle={{ width: "140px", height: "auto" }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-4 rounded bg-[#fde68a]" />
          <span>{t.dashboard.light}</span>
          <span className="h-2 w-4 rounded bg-[#ea580c]" />
          <span>{t.dashboard.heavy}</span>
        </div>
      </CardContent>
    </Card>
  );
}
