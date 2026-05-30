"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExercises, usePrograms } from "@/lib/hooks/use-queries";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from "@/lib/utils/constants";
import { ChevronDown, Search, Dumbbell, Sparkles, Plus, Library, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateProgram } from "@/lib/ai/briefing";
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
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
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
  const [showAi, setShowAi] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof generateProgram>> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const result = await generateProgram(aiQuery);
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAi(!showAi)}>
          <Sparkles className="h-4 w-4 text-primary" />
          AI Builder
        </Button>
      </div>

      {showAi && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Describe your ideal program, e.g. "Upper/Lower split, 4 days, focus on shoulders"
            </p>
            <div className="flex gap-2">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Describe your program..."
                className="flex-1"
              />
              <Button onClick={handleAiGenerate} disabled={aiLoading}>
                {aiLoading ? "..." : "Generate"}
              </Button>
            </div>
            {aiResult && (
              <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                <div>
                  <p className="font-semibold text-sm">{aiResult.name}</p>
                  <p className="text-xs text-muted-foreground">{aiResult.description}</p>
                </div>
                {aiResult.sessions.map((s, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{s.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.exercises.map((ex, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="default" size="sm" className="w-full">
                  <Plus className="h-3 w-3" /> Save Program
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Your Programs
      </h2>

      {programs?.map((prog) => (
        <Card key={prog.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{prog.name}</p>
                <p className="text-xs text-muted-foreground">{prog.description}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {prog.daysPerWeek} days/week
                  </Badge>
                  {prog.isActive && <Badge className="text-[10px]">Active</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {prog.sessions.map((s) => (
                <div key={s.id} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs font-medium">{s.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.exercises.map((se) => (
                      <Badge key={se.id} variant="outline" className="text-[10px]">
                        {se.exercise?.name || "..."}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
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
    </>
  );
}
