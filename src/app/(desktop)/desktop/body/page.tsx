"use client";

import { useMemo } from "react";
import { Percent, Ruler, Scale, Waves } from "lucide-react";
import { PageHeader } from "@/components/desktop/page-header";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonBlock,
  StatTile,
} from "@/components/desktop/ui";
import { BodyChart } from "@/components/desktop/charts/body-chart";
import { useBodyMeasurements } from "@/lib/hooks/use-data";
import { buildBodySeries, movingAverage } from "@/lib/desktop/analytics";
import { formatDay, formatFullDay, formatNumber } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";

function lastValue(values: (number | undefined)[]): number | undefined {
  for (let i = values.length - 1; i >= 0; i--) {
    if (typeof values[i] === "number") return values[i];
  }
  return undefined;
}

function firstValue(values: (number | undefined)[]): number | undefined {
  return values.find((value): value is number => typeof value === "number");
}

export default function BodyPage() {
  const dt = useDt();
  const locale = useLocale();
  const measurements = useBodyMeasurements();

  const series = useMemo(
    () => (measurements ? buildBodySeries(measurements) : []),
    [measurements]
  );

  const rows = useMemo(() => {
    const trend = movingAverage(
      series.map((point) => point.weight),
      7
    );
    return series.map((point, index) => ({
      ...point,
      label: formatDay(point.date, locale),
      weightTrend: trend[index],
    }));
  }, [series, locale]);

  if (!measurements) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-80" />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <>
        <PageHeader title={dt.nav.body} description={dt.subtitles.body} />
        <Panel>
          <EmptyState icon={Scale} title={dt.body.empty} />
        </Panel>
      </>
    );
  }

  const weights = series.map((point) => point.weight);
  const currentWeight = lastValue(weights);
  const startWeight = firstValue(weights);
  const weightChange =
    currentWeight != null && startWeight != null ? currentWeight - startWeight : null;

  const fat = lastValue(series.map((point) => point.bodyFat));
  const waist = lastValue(series.map((point) => point.waist));
  const arms = lastValue(series.map((point) => point.arms));

  const latest = series[series.length - 1];

  return (
    <div className="desk-enter">
      <PageHeader title={dt.nav.body} description={dt.subtitles.body} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          accent
          icon={Scale}
          label={dt.body.weight}
          value={currentWeight != null ? formatNumber(currentWeight, locale, 1) : "—"}
          unit={dt.units.kg}
          caption={
            weightChange != null
              ? (weightChange > 0 ? "+" : "") +
                formatNumber(weightChange, locale, 1) +
                " " +
                dt.units.kg
              : undefined
          }
        />
        <StatTile
          icon={Percent}
          label={dt.body.bodyFat}
          value={fat != null ? formatNumber(fat, locale, 1) : "—"}
          unit="%"
        />
        <StatTile
          icon={Waves}
          label={dt.body.waist}
          value={waist != null ? formatNumber(waist, locale, 1) : "—"}
          unit="cm"
        />
        <StatTile
          icon={Ruler}
          label={dt.body.arms}
          value={arms != null ? formatNumber(arms, locale, 1) : "—"}
          unit="cm"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel accent className="xl:col-span-7">
          <PanelHeader icon={Scale} title={dt.body.weight} hint={dt.body.trend} />
          <PanelBody>
            <BodyChart
              data={rows}
              unit={dt.units.kg}
              series={[
                {
                  key: "weight",
                  label: dt.body.weight,
                  color: "var(--color-chart-1)",
                },
                {
                  key: "weightTrend",
                  label: dt.body.trend,
                  color: "#38bdf8",
                  dashed: true,
                },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHeader icon={Ruler} title={dt.body.circumference} hint="cm" />
          <PanelBody>
            <BodyChart
              data={rows}
              unit="cm"
              height={250}
              series={[
                { key: "chest", label: dt.body.chest, color: "#f472b6" },
                { key: "waist", label: dt.body.waist, color: "#fbbf24" },
                { key: "arms", label: dt.body.arms, color: "#34d399" },
                { key: "thighs", label: dt.body.thighs, color: "#a78bfa" },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-12">
          <PanelHeader
            icon={Scale}
            title={dt.body.latest}
            hint={formatFullDay(latest.date, locale)}
            action={
              <span className="desk-num text-xs text-muted-foreground">
                {series.length} {dt.body.entries.toLowerCase()}
              </span>
            }
          />
          <div className="desk-scroll max-h-[24rem] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--desk-line)]">
                  <th className="desk-label px-4 py-2 text-left font-semibold">
                    {dt.table.date}
                  </th>
                  {(
                    [
                      ["weight", dt.body.weight],
                      ["bodyFat", dt.body.bodyFat],
                      ["chest", dt.body.chest],
                      ["waist", dt.body.waist],
                      ["arms", dt.body.arms],
                      ["thighs", dt.body.thighs],
                    ] as const
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      className="desk-label px-4 py-2 text-right font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((point) => (
                  <tr
                    key={point.date}
                    className="desk-row border-b border-[var(--desk-line)] last:border-0 hover:bg-muted/40"
                  >
                    <td className="desk-num px-4 py-2 text-xs font-medium">
                      {formatFullDay(point.date, locale)}
                    </td>
                    {(
                      ["weight", "bodyFat", "chest", "waist", "arms", "thighs"] as const
                    ).map((key) => (
                      <td
                        key={key}
                        className="desk-num px-4 py-2 text-right text-xs text-muted-foreground"
                      >
                        {typeof point[key] === "number"
                          ? formatNumber(point[key] as number, locale, 1)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
