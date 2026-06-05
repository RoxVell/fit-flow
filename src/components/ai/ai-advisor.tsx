"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdvice } from "@/lib/ai/briefing";
import { useExerciseHistory } from "@/lib/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";

interface AiAdvisorProps {
  exerciseId: string;
  exerciseName: string;
}

export function AiAdvisor({ exerciseId, exerciseName }: AiAdvisorProps) {
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const history = useExerciseHistory(exerciseId);

  const handleGetAdvice = async () => {
    setOpen(true);
    setLoading(true);
    const recent = (history || []).slice(-5).map((h) => ({
      weight: h.maxWeight,
      reps: 8,
    }));
    const result = await getAdvice(exerciseName, recent);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <>
      <button onClick={handleGetAdvice} className="rounded-lg p-1.5 text-primary hover:bg-muted transition-colors">
        <Sparkles className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI Advisor</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{exerciseName}</p>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <p className="text-sm whitespace-pre-line">{advice}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
