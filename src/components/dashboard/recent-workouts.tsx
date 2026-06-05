"use client";

import { CalendarDays } from "lucide-react";
import { useWorkoutLogs } from "@/lib/hooks/use-data";
import { formatDuration } from "@/lib/utils/calculations";
import { volume } from "@/lib/training-metrics";

function formatWorkoutDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDurationMinutes(startedAt: string, endedAt?: string) {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

export function RecentWorkouts() {
  const logs = useWorkoutLogs(10);

  if (!logs) return null;

  const completed = logs.filter((l) => l.endedAt).slice(0, 5);
  if (completed.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-4 pb-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Recent Workouts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Date</th>
              <th className="px-4 py-2 text-left font-medium">Session</th>
              <th className="px-4 py-2 text-right font-medium">Time</th>
              <th className="px-4 py-2 text-right font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {completed.map((log) => {
              const duration = getDurationMinutes(log.startedAt, log.endedAt);
              const totalVolume = log.exercises.reduce(
                (sum, e) =>
                  sum + volume(e.sets.filter((s) => s.completed)),
                0
              );

              return (
                <tr
                  key={log.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {formatWorkoutDate(log.startedAt)}
                  </td>
                  <td className="max-w-[7rem] truncate px-4 py-2.5 font-medium">
                    {log.sessionName || "Workout"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                    {duration != null ? formatDuration(duration) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                    {totalVolume > 0 ? `${Math.round(totalVolume)} kg` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
