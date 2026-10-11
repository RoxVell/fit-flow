"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MuscleSlice } from "@/lib/desktop/analytics";
import { BODY_PART_CHART_COLORS } from "@/lib/charts/body-part-colors";
import { formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import {
  AXIS_STYLE,
  ChartTooltip,
  GRID_STROKE,
  type TooltipRenderProps,
} from "./chart-kit";

export function MuscleRadar({
  data,
  height = 240,
}: {
  data: MuscleSlice[];
  height?: number;
}) {
  const dt = useDt();
  const locale = useLocale();

  const chartData = data.map((slice) => ({
    ...slice,
    label: dt.bodyParts[slice.bodyPart],
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke={GRID_STROKE} />
          <PolarAngleAxis dataKey="label" tick={AXIS_STYLE} />
          <Tooltip
            content={(props: TooltipRenderProps<(typeof chartData)[number]>) => {
              if (!props.active || !props.payload?.length) return null;
              const slice = props.payload[0]?.payload;
              if (!slice) return null;
              return (
                <ChartTooltip
                  title={slice.label}
                  rows={[
                    {
                      label: dt.kpi.sets,
                      value: formatNumber(slice.sets, locale),
                      color: BODY_PART_CHART_COLORS[slice.bodyPart],
                    },
                    {
                      label: dt.kpi.volume,
                      value: formatNumber(slice.volume, locale) + " " + dt.units.kg,
                    },
                    { label: "%", value: slice.share.toFixed(1) + "%" },
                  ]}
                />
              );
            }}
          />
          <Radar
            dataKey="previousSets"
            stroke="color-mix(in oklch, var(--color-foreground) 35%, transparent)"
            strokeDasharray="3 3"
            fill="none"
          />
          <Radar
            dataKey="sets"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="var(--color-chart-1)"
            fillOpacity={0.22}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
