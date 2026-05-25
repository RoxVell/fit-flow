"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Dumbbell } from "lucide-react";
import { useExercises } from "@/lib/hooks/use-queries";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from "@/lib/utils/constants";
import type { MuscleGroup, Exercise } from "@/lib/db/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

const muscleGroups: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "quads",
  "hamstrings", "glutes", "calves", "abs", "traps",
];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedExercise] = useState<Exercise | null>(null);

  const { data: exercises, isLoading } = useExercises({
    search: search || undefined,
    muscleGroup: selectedMuscle || undefined,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 space-y-3">
        <h1 className="text-xl font-bold">Exercise Library</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            <Badge
              variant={!selectedMuscle ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedMuscle(null)}
            >
              All
            </Badge>
            {muscleGroups.map((mg) => (
              <Badge
                key={mg}
                variant={selectedMuscle === mg ? "default" : "outline"}
                className="cursor-pointer shrink-0"
                onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
              >
                {MUSCLE_GROUP_LABELS[mg]}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : exercises?.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8" />
            <p className="text-sm">No exercises found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises?.map((ex) => (
              <Sheet key={ex.id}>
                <SheetTrigger className="w-full text-left">
                  <Card className="cursor-pointer active:scale-[0.99] transition-transform">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ex.name}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {EQUIPMENT_LABELS[ex.equipment]}
                          </Badge>
                          {ex.unilateral && (
                            <Badge variant="outline" className="text-[10px]">Unilateral</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>{ex.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</Badge>
                      <Badge variant="secondary">{EQUIPMENT_LABELS[ex.equipment]}</Badge>
                      <Badge variant="outline">{ex.category}</Badge>
                      {ex.unilateral && <Badge variant="outline">Unilateral</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{ex.description}</p>
                    {ex.secondaryMuscles.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Secondary muscles:</p>
                        <div className="flex flex-wrap gap-1">
                          {ex.secondaryMuscles.map((sm) => (
                            <Badge key={sm} variant="outline" className="text-[10px]">
                              {MUSCLE_GROUP_LABELS[sm]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
