import { Chart, Host } from "@expo/ui/swift-ui";
import { Platform, StyleSheet, Text } from "react-native";

import { useScheme, useTheme } from "@/hooks/use-theme";
import type { ChartPoint } from "@/lib/charts/domain";
import { useT } from "@/lib/i18n/locale-context";

export const CHART_HEIGHT = 170;

type Props = {
  points: ChartPoint[];
  color: string;
  type?: "line" | "bar";
  /** Draw a dashed rule at y = 0 (used when the series is plotted as a delta). */
  zeroLine?: boolean;
  height?: number;
};

// Single-series Swift Charts wrapper. Categorical x labels are used as given;
// the y axis is auto-scaled by SwiftUI and anchored at zero.
export function ProgressChart({ points, color, type = "line", zeroLine = false, height = CHART_HEIGHT }: Props) {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();

  if (Platform.OS !== "ios") {
    return <Text style={[styles.fallback, { color: theme.textSecondary, height }]}>{t.common.comingSoon}</Text>;
  }

  if (points.length === 0) {
    return <Text style={[styles.fallback, { color: theme.textSecondary, height }]}>{t.progress.noPeriodData}</Text>;
  }

  return (
    <Host style={{ height }} colorScheme={scheme}>
      <Chart
        type={type}
        data={points.map((p) => ({ x: p.x, y: p.y, ...(type === "bar" ? { color } : {}) }))}
        referenceLines={zeroLine ? [{ x: points[0].x, y: 0 }] : undefined}
        lineStyle={{ color, width: 2, pointStyle: "circle", pointSize: points.length > 24 ? 0 : 6 }}
        barStyle={{ cornerRadius: 4 }}
        ruleStyle={{ color: theme.border, lineWidth: 1, dashArray: [4, 4] }}
        showGrid
        animate
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  fallback: {
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: CHART_HEIGHT,
    fontSize: 14,
  },
});
