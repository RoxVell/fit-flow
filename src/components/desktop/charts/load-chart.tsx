"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekPoint } from "@/lib/desktop/analytics";
import { formatCompact, formatDay, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import {
  AXIS_STYLE,
  ChartTooltip,
  GRID_STROKE,
  Legend,
  type TooltipRenderProps,
} from "./chart-kit";

type Metric = "volume" | "sets" | "duration" | "intensity";

export function LoadChart({
  data,
  height = 260,
  secondary = "sets",
  fill = false,
}: {
  data: WeekPoint[];
  height?: number;
  secondary?: Metric;
  /** Grow to the height of the parent instead of using a fixed height. */
  fill?: boolean;
}) {
  const locale = useLocale();
  const dt = useDt();

  const secondaryLabel =
    secondary === "sets"
      ? dt.kpi.sets
      : secondary === "duration"
        ? dt.kpi.duration
        : dt.kpi.intensity;

  const chartData = data.map((point) => ({
    ...point,
    label: formatDay(point.weekStart, locale),
  }));

  return (
    <div className={fill ? "flex h-full min-h-0 flex-col gap-2" : "space-y-2"}>
      <Legend
        items={[
          { label: dt.kpi.volume, color: "var(--color-chart-1)" },
          { label: secondaryLabel, color: "#38bdf8" },
        ]}
      />
      <div
        className={fill ? "min-h-0 flex-1" : undefined}
        style={fill ? undefined : { height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="deskVolumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.42} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              yAxisId="left"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={68}
              tickFormatter={(value: number) => formatCompact(value, locale)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip
              cursor={{ stroke: GRID_STROKE }}
              content={(props: TooltipRenderProps<WeekPoint & { label: string }>) => {
                if (!props.active || !props.payload?.length) return null;
                const point = props.payload[0]?.payload;
                if (!point) return null;
                return (
                  <ChartTooltip
                    title={point.label}
                    rows={[
                      {
                        label: dt.kpi.volume,
                        value: formatNumber(point.volume, locale) + " " + dt.units.kg,
                        color: "var(--color-chart-1)",
                      },
                      {
                        label: dt.kpi.sets,
                        value: formatNumber(point.sets, locale),
                        color: "#38bdf8",
                      },
                      {
                        label: dt.kpi.workouts,
                        value: formatNumber(point.workouts, locale),
                      },
                      {
                        label: dt.kpi.duration,
                        value: point.duration
                          ? point.duration + " " + dt.units.min
                          : "—",
                      },
                    ]}
                  />
                );
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="volume"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#deskVolumeFill)"
              dot={false}
              activeDot={{ r: 3 }}
            />
            {secondary === "sets" ? (
              <Bar
                yAxisId="right"
                dataKey="sets"
                fill="#38bdf8"
                fillOpacity={0.35}
                radius={[3, 3, 0, 0]}
                barSize={10}
              />
            ) : (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={secondary}
                stroke="#38bdf8"
                strokeWidth={1.75}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
