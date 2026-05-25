"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMeasurements } from "@/lib/hooks/use-queries";
import { usePersonalRecords } from "@/lib/hooks/use-queries";
import { Trophy, Dumbbell } from "lucide-react";

export function WeightChart() {
  const { data: measurements } = useBodyMeasurements();
  const { data: records } = usePersonalRecords();

  const chartData = measurements?.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: m.weight,
    bodyFat: m.bodyFat,
  }));

  const recentRecords = records?.slice(0, 5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Body Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip wrapperClassName="rounded-lg border bg-card text-card-foreground shadow-sm" />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 3 }}
                    name="Weight (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No measurements yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {recentRecords && recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRecords.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{pr.exerciseName}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {pr.value} {pr.type === "volume" ? "kg vol" : "kg"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
