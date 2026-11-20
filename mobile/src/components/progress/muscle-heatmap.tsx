import { StyleSheet, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

import { Card } from "@/components/card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { MuscleGroup } from "@/lib/db/types";
import {
  ANTERIOR_VIEWBOX,
  POSTERIOR_VIEWBOX,
  anteriorMuscles,
  posteriorMuscles,
  type BodyMuscle,
  type MusclePolygons,
} from "@/lib/charts/body-svg";
import { useT } from "@/lib/i18n/locale-context";

const HIGHLIGHT = ["#fde68a", "#fb923c", "#f97316", "#ea580c"] as const;

/** Same mapping as the web MuscleHeatmap, plus posterior delts so the back view lights up. */
const MUSCLE_MAP: Partial<Record<MuscleGroup, BodyMuscle[]>> = {
  chest: ["chest"],
  back: ["upper-back", "lower-back"],
  shoulders: ["front-deltoids", "back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
  abs: ["abs"],
  traps: ["trapezius"],
};

type Props = {
  data?: Partial<Record<MuscleGroup, number>>;
  /** Direct per-region load (exercise detail uses named library muscles). */
  bodyLoad?: Partial<Record<BodyMuscle, number>>;
  compact?: boolean;
};

function toSvgPoints(raw: string): string {
  const nums = raw.trim().split(/\s+/);
  const pairs: string[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pairs.push(`${nums[i]},${nums[i + 1]}`);
  }
  return pairs.join(" ");
}

function colorForFrequency(frequency: number, bodyColor: string): string {
  if (frequency <= 0) return bodyColor;
  const idx = Math.min(HIGHLIGHT.length, Math.max(1, Math.ceil(frequency))) - 1;
  return HIGHLIGHT[idx];
}

function BodyView({
  muscles,
  viewBox,
  fills,
  bodyColor,
  width = 140,
}: {
  muscles: MusclePolygons[];
  viewBox: string;
  fills: Partial<Record<BodyMuscle, string>>;
  bodyColor: string;
  width?: number;
}) {
  const height = Math.round(width * (viewBox === POSTERIOR_VIEWBOX ? 308 / 140 : 280 / 140));
  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      {muscles.flatMap((muscle) =>
        muscle.points.map((pts, i) => (
          <Polygon
            key={`${muscle.muscle}-${i}`}
            points={toSvgPoints(pts)}
            fill={fills[muscle.muscle] ?? bodyColor}
          />
        )),
      )}
    </Svg>
  );
}

function weightsToFills(data: Partial<Record<MuscleGroup, number>>, bodyColor: string): Partial<Record<BodyMuscle, string>> {
  const fills: Partial<Record<BodyMuscle, string>> = {};
  for (const [group, freq] of Object.entries(data) as [MuscleGroup, number][]) {
    if (!freq || freq <= 0) continue;
    const mapped = MUSCLE_MAP[group];
    if (!mapped) continue;
    const color = colorForFrequency(freq, bodyColor);
    for (const muscle of mapped) {
      fills[muscle] = color;
    }
  }
  return fills;
}

function bodyLoadToFills(load: Partial<Record<BodyMuscle, number>>, bodyColor: string): Partial<Record<BodyMuscle, string>> {
  const fills: Partial<Record<BodyMuscle, string>> = {};
  for (const [muscle, freq] of Object.entries(load) as [BodyMuscle, number][]) {
    if (!freq || freq <= 0) continue;
    fills[muscle] = colorForFrequency(freq, bodyColor);
  }
  return fills;
}

export function MuscleHeatmap({ data = {}, bodyLoad, compact }: Props) {
  const t = useT();
  const theme = useTheme();
  const fills = bodyLoad ? bodyLoadToFills(bodyLoad, theme.muted) : weightsToFills(data, theme.muted);

  const size = compact ? 110 : 140;
  const bodies = (
    <View style={styles.bodies}>
      <BodyView
        muscles={anteriorMuscles}
        viewBox={ANTERIOR_VIEWBOX}
        fills={fills}
        bodyColor={theme.muted}
        width={size}
      />
      <BodyView
        muscles={posteriorMuscles}
        viewBox={POSTERIOR_VIEWBOX}
        fills={fills}
        bodyColor={theme.muted}
        width={size}
      />
    </View>
  );

  if (compact) return bodies;

  return (
    <Card>
      <SectionTitle symbol="figure.arms.open" title={t.dashboard.muscleLoad} />
      {bodies}
      <View style={styles.legend}>
        <View style={[styles.swatch, { backgroundColor: HIGHLIGHT[0] }]} />
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t.dashboard.light}</Text>
        <View style={[styles.swatch, { backgroundColor: HIGHLIGHT[3] }]} />
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t.dashboard.heavy}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bodies: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  swatch: {
    height: 8,
    width: 16,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
});
