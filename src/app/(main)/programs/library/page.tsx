"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExercises, usePrograms } from "@/lib/hooks/use-queries";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from "@/lib/utils/constants";
import { Search, Dumbbell, Plus, Pencil, Library, LayoutList } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MuscleGroup, Exercise } from "@/lib/db/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const muscleGroups: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "quads",
  "hamstrings", "glutes", "calves", "abs", "traps",
];

const views = [
  { value: "programs", label: "Programs", icon: Library },
  { value: "exercises", label: "Exercises", icon: LayoutList },
] as const;

export default function ProgramsPage() {
  const [view, setView] = useState<"programs" | "exercises">("programs");

  return (
    <div className="flex flex-col h-full pt-[env(safe-area-inset-top)]">
      {/* Segmented control */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold mb-3">Programs</h1>
        <div className="flex rounded-lg bg-muted p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setView(v.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                view === v.value
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              )}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "programs" ? <ProgramsView /> : <ExercisesView />}
    </div>
  );
}

function ProgramsView() {
  const { data: programs } = usePrograms();

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your Programs
        </h2>
        <Link href="/programs/create">
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Create new program
          </Button>
        </Link>
      </div>

      {programs?.map((prog) => (
        <Card key={prog.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 pt-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold">{prog.name}</p>
                    {prog.isActive && (
                      <Badge className="text-[10px] h-5 px-2">Active</Badge>
                    )}
                  </div>
                  {prog.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{prog.description}</p>
                  )}
                  <Badge variant="secondary" className="text-[10px] mt-1.5">
                    {prog.daysPerWeek} days &middot; {prog.sessions.length} sessions
                  </Badge>
                </div>
                <Link href={`/programs/create?edit=${prog.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs shrink-0">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
            <div className="border-t divide-y divide-border">
              {prog.sessions.map((s) => {
                const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.dayOfWeek % 7];
                return (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">{dayLabel}</span>
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{s.exercises.length} ex.</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-10">
                      {s.exercises.map((se) => (
                        <Badge key={se.id} variant="outline" className="text-xs font-normal">
                          {se.exercise?.name || "..."}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExercisesView() {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const { data: exercises, isLoading } = useExercises({
    search: search || undefined,
    muscleGroup: selectedMuscle || undefined,
  });

  return (
    <>
      <div className="px-4 pb-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            className="pl-9 text-sm"
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
    </>
  );
}
