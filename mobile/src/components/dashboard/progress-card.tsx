import { Chart, Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { formatShortDate } from "@/lib/dashboard/date";
import { CHART_PERIODS, DEFAULT_CHART_PERIOD, buildGeneralProgress, type ChartPeriod } from "@/lib/dashboard/progress";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { listWorkoutLogs } from "@/lib/repositories/workouts";

import { Accent } from "./accents";
import { SectionTitle } from "./section-title";

const CHART_HEIGHT = 160;

// "General progress": progress index averaged over exercises, weekly.
// Hidden until there are at least two weeks of data, like the web app.
export function ProgressCard() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const { locale } = useLocale();
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const logs = useLiveQuery(() => listWorkoutLogs(200), [TABLES.workoutLogs]);

  const model = buildGeneralProgress(logs, period, (iso) => formatShortDate(iso, locale));
  if (!model) return null;

  const { points, change } = model;
  const positive = change.percent > 0;
  const neutral = change.percent === 0;
  const color = neutral ? theme.textSecondary : positive ? theme.success : Accent.red;
  const sign = positive ? "+" : "";

  return (
    <Card>
      <SectionTitle symbol="chart.line.uptrend.xyaxis" title={t.dashboard.generalProgress} />
      <View style={styles.change}>
        {!neutral && (
          <SymbolView name={positive ? "arrow.up.right" : "arrow.down.right"} size={18} tintColor={color} weight="bold" />
        )}
        <Text style={[styles.changeText, { color }]}>
          {sign}
          {change.percent}%
        </Text>
      </View>

      <Host matchContents colorScheme={scheme}>
        <Picker
          label={t.dashboard.generalProgress}
          selection={period}
          onSelectionChange={setPeriod}
          modifiers={[pickerStyle("segmented"), labelsHidden()]}>
          {CHART_PERIODS.map((p) => (
            <SwiftText key={p} modifiers={[tag(p)]}>
              {t.dashboard.periods[p]}
            </SwiftText>
          ))}
        </Picker>
      </Host>

      {Platform.OS === "ios" ? (
        <Host style={styles.chart} colorScheme={scheme}>
          {/* Plotted as change vs the period start so the auto-scaled axis keeps the curve readable. */}
          <Chart
            type="line"
            data={points.map((p) => ({ x: p.week, y: Math.round((p.progress - 100) * 10) / 10 }))}
            referenceLines={[{ x: points[0].week, y: 0 }]}
            lineStyle={{ color, width: 2, pointStyle: "circle", pointSize: 6 }}
            ruleStyle={{ color: theme.border, lineWidth: 1, dashArray: [4, 4] }}
            showGrid
            animate
          />
        </Host>
      ) : (
        <Text style={[styles.fallback, { color: theme.textSecondary }]}>{t.common.comingSoon}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  change: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  changeText: {
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chart: {
    height: CHART_HEIGHT,
  },
  fallback: {
    height: CHART_HEIGHT,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 14,
  },
});
