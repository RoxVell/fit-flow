"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExercisePoint } from "@/lib/desktop/analytics";
import { formatDay, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import {
  AXIS_STYLE,
  ChartTooltip,
  GRID_STROKE,
  type TooltipRenderProps,
} from "./chart-kit";

export function StrengthChart({
  data,
  height = 240,
  fill = false,
}: {
  data: ExercisePoint[];
  height?: number;
  /** Grow to the height of the parent instead of using a fixed height. */
  fill?: boolean;
}) {
  const locale = useLocale();
  const dt = useDt();

  const chartData = data.map((point) => ({
    ...point,
    label: formatDay(point.date, locale),
  }));

  const values = data.map((p) => p.e1rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, (max - min) * 0.2);

  return (
    <div
      className={fill ? "h-full min-h-[14rem]" : undefined}
      style={fill ? undefined : { height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="deskStrengthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={46}
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(value: number) => Math.round(value).toString()}
          />
          <Tooltip
            cursor={{ stroke: GRID_STROKE }}
            content={(props: TooltipRenderProps<(typeof chartData)[number]>) => {
              if (!props.active || !props.payload?.length) return null;
              const point = props.payload[0]?.payload;
              if (!point) return null;
              return (
                <ChartTooltip
                  title={point.label}
                  rows={[
                    {
                      label: dt.table.e1rm,
                      value: formatNumber(point.e1rm, locale, 1) + " " + dt.units.kg,
                      color: "var(--color-chart-1)",
                    },
                    {
                      label: dt.table.best,
                      value: formatNumber(point.topWeight, locale, 1) + " " + dt.units.kg,
                    },
                    {
                      label: dt.kpi.volume,
                      value: formatNumber(point.volume, locale) + " " + dt.units.kg,
                    },
                    { label: dt.kpi.reps, value: formatNumber(point.reps, locale) },
                  ]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="e1rm"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#deskStrengthFill)"
            dot={{ r: 2, strokeWidth: 0, fill: "var(--color-chart-1)" }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
