"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMeasurements } from "@/lib/hooks/use-queries";

const COLORS = ["var(--color-primary)", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const measurementConfig = [
  { key: "weight", label: "Weight (kg)", color: COLORS[0] },
  { key: "chest", label: "Chest (cm)", color: COLORS[1] },
  { key: "waist", label: "Waist (cm)", color: COLORS[2] },
  { key: "arms", label: "Arms (cm)", color: COLORS[3] },
  { key: "thighs", label: "Thighs (cm)", color: COLORS[4] },
  { key: "calves", label: "Calves (cm)", color: COLORS[5] },
];

export function BodyTab() {
  const { data: measurements } = useBodyMeasurements();

  const chartData = measurements?.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: m.weight,
    bodyFat: m.bodyFat,
    chest: m.chest,
    waist: m.waist,
    arms: m.arms,
    thighs: m.thighs,
    calves: m.calves,
  }));

  const hasMeasurements = chartData && chartData.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Body Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 outline-none">
            {hasMeasurements ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" domain={["dataMin - 2", "dataMax + 2"]} />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Body Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 outline-none">
            {hasMeasurements ? (
              <ResponsiveContainer width="100%" height="100%">
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
                  {measurementConfig.map((cfg) => (
                    <Line
                      key={cfg.key}
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={2}
                      dot={{ fill: cfg.color, r: 2 }}
                      name={cfg.label}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No measurements yet
              </div>
            )}
          </div>
          {hasMeasurements && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {measurementConfig.map((cfg) => (
                <div key={cfg.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
