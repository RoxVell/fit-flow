"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDay, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  AXIS_STYLE,
  ChartTooltip,
  GRID_STROKE,
  Legend,
  type TooltipRenderProps,
} from "./chart-kit";

export type BodySeries = {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
};

export function BodyChart({
  data,
  series,
  height = 250,
  unit,
}: {
  data: Record<string, number | string | null>[];
  series: BodySeries[];
  height?: number;
  unit: string;
}) {
  const locale = useLocale();

  // Metrics that were never logged would otherwise show as empty legend chips.
  const present = series.filter((s) =>
    data.some((row) => typeof row[s.key] === "number")
  );

  return (
    <div className="space-y-2">
      <Legend items={present.map((s) => ({ label: s.label, color: s.color }))} />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
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
              width={44}
              domain={["dataMin - 2", "dataMax + 2"]}
              tickFormatter={(value: number) => Math.round(value).toString()}
            />
            <Tooltip
              cursor={{ stroke: GRID_STROKE }}
              content={(
                props: TooltipRenderProps<Record<string, number | string | null>>
              ) => {
                if (!props.active || !props.payload?.length) return null;
                const point = props.payload[0]?.payload;
                if (!point) return null;
                return (
                  <ChartTooltip
                    title={String(point.label ?? "")}
                    rows={present
                      .filter((s) => typeof point[s.key] === "number")
                      .map((s) => ({
                        label: s.label,
                        value:
                          formatNumber(point[s.key] as number, locale, 1) + " " + unit,
                        color: s.color,
                      }))}
                  />
                );
              }}
            />
            {present.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={s.dashed ? 1.5 : 2}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                dot={false}
                connectNulls
                activeDot={s.dashed ? false : { r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function toChartRows<T extends { date: string }>(
  points: T[],
  locale: Parameters<typeof formatDay>[1]
): (T & { label: string })[] {
  return points.map((point) => ({ ...point, label: formatDay(point.date, locale) }));
}
