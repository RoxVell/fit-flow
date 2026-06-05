"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkoutLogs, useExercises } from "@/lib/hooks/use-data";
import { generateBriefing, type AiBriefing } from "@/lib/ai/briefing";

export function AiBriefingCard() {
  const logs = useWorkoutLogs(30);
  const exercises = useExercises();
  const logsLoading = logs === undefined;
  const exLoading = exercises === undefined;
  const [briefing, setBriefing] = useState<AiBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!logs || !exercises) return;
    setLoading(true);
    generateBriefing(logs, exercises).then((b) => {
      setBriefing(b);
      setLoading(false);
    });
  }, [logs, exercises]);

  if (loading || logsLoading || exLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!briefing) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{briefing.summary}</p>
        {briefing.highlights.length > 0 && (
          <div className="space-y-1">
            {briefing.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                {h}
              </div>
            ))}
          </div>
        )}
        {briefing.concerns.length > 0 && (
          <div className="space-y-1">
            {briefing.concerns.slice(0, 2).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {c}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
