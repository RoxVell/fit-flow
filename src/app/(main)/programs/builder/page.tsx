"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExercises, usePrograms } from "@/lib/hooks/use-queries";
import { MUSCLE_GROUP_LABELS } from "@/lib/utils/constants";
import { Sparkles, Plus, GripVertical, Trash2 } from "lucide-react";
import { generateProgram } from "@/lib/ai/briefing";

export default function ProgramBuilderPage() {
  const { data: allExercises } = useExercises();
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
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Program Builder</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAi(!showAi)}>
          <Sparkles className="h-4 w-4 text-primary" />
          AI Builder
        </Button>
      </div>

      {/* AI Builder */}
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

      {/* Existing Programs */}
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
