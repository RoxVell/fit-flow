"use client";

import { useEffect, useState } from "react";
import { SEED_EXERCISES } from "@/lib/db/seed-exercise-ids";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useExerciseHistory,
  useExerciseDetailedHistory,
  useExercises,
} from "@/lib/hooks/use-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryAccordion } from "@/components/progress/history-accordion";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";

export function ExercisesTab() {
  const t = useT();
  const { formatChartDate } = useFormat();
  const allExercises = useExercises();
  const [selectedId, setSelectedId] = useState<string>(SEED_EXERCISES.barbellBenchPress);

  useEffect(() => {
    if (allExercises?.length && !allExercises.some((e) => e.id === selectedId)) {
      setSelectedId(allExercises[0].id);
    }
  }, [allExercises, selectedId]);
  const history = useExerciseHistory(selectedId);
  const detailedHistory = useExerciseDetailedHistory(selectedId);
  const [chartType, setChartType] = useState<"1rm" | "volume">("1rm");

  const chartData = history?.map((h) => ({
    date: formatChartDate(h.date),
    estimated1RM: Math.round(h.estimated1RM * 10) / 10,
    volume: Math.round(h.volume),
  }));

  const selectedExercise = allExercises?.find((e) => e.id === selectedId);

  const sessions = detailedHistory || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t.progress.exerciseProgress}</CardTitle>
          <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
            <SelectTrigger className="w-40 h-7 text-xs">
              <SelectValue>{selectedExercise?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allExercises?.map((ex) => (
                <SelectItem key={ex.id} value={ex.id} className="text-sm">
                  {ex.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
            <TabsList className="mb-3">
              <TabsTrigger value="1rm" className="text-xs">{t.dashboard.prE1rm}</TabsTrigger>
              <TabsTrigger value="volume" className="text-xs">{t.progress.chartVolume}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="h-48 outline-none">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "1rm" ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{
                        backgroundColor: "#1f1f1f",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#eee",
                      }}
                      cursor={{ stroke: "#444", strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated1RM"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-primary)", r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{
                        backgroundColor: "#1f1f1f",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#eee",
                      }}
                      cursor={{ fill: "#333" }}
                    />
                    <Bar dataKey="volume" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t.progress.noData}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <HistoryAccordion sessions={sessions} />
    </div>
  );
}
