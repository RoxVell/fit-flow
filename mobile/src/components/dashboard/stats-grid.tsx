import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { WeightTrend } from "@/lib/dashboard/daily-body-view";
import { EM_DASH } from "@/lib/dashboard/date";
import type { DashboardSummary } from "@/lib/dashboard/stats";
import { useT } from "@/lib/i18n/locale-context";

import { Accent, tint } from "./accents";

type TileProps = {
  symbol: SFSymbol;
  color: string;
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  trend?: WeightTrend;
  onPress?: () => void;
};

function TrendIcon({ trend }: { trend: WeightTrend }) {
  const theme = useTheme();
  const icon: Record<WeightTrend, { name: SFSymbol; color: string }> = {
    up: { name: "arrow.up.right", color: theme.success },
    down: { name: "arrow.down.right", color: Accent.red },
    stable: { name: "minus", color: theme.textSecondary },
  };
  return <SymbolView name={icon[trend].name} size={14} tintColor={icon[trend].color} weight="bold" />;
}

function Tile({ symbol, color, label, value, unit, caption, trend, onPress }: TileProps) {
  const theme = useTheme();
  const body = (
    <Card style={styles.tile}>
      <View style={styles.tileHeader}>
        <View style={[styles.iconWrap, { backgroundColor: tint(color) }]}>
          <SymbolView name={symbol} size={16} tintColor={color} />
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        {trend && <TrendIcon trend={trend} />}
      </View>
      <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
        {value}
        {unit && <Text style={[styles.unit, { color: theme.textSecondary }]}> {unit}</Text>}
      </Text>
      {caption && (
        <Text style={[styles.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {caption}
        </Text>
      )}
    </Card>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.tilePress}>
      {body}
    </Pressable>
  );
}

// 2x2 "Smart Stats" grid from the design brief. Steps and calories have no
// data source on the web either; they are HealthKit follow-ups on iOS.
export function StatsGrid({
  currentWeight,
  weightTrend,
  hasWeightHistory,
  activeDays,
  onWeightPress,
}: DashboardSummary & { onWeightPress?: () => void }) {
  const t = useT();
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Tile symbol="figure.walk" color={Accent.blue} label={t.dashboard.steps} value={EM_DASH} caption={t.dashboard.healthKitSoon} />
        <Tile symbol="flame.fill" color={theme.primary} label={t.dashboard.calories} value={EM_DASH} caption={t.dashboard.healthKitSoon} />
      </View>
      <View style={styles.row}>
        <Tile
          symbol="scalemass.fill"
          color={theme.success}
          label={t.dashboard.weight}
          value={currentWeight != null ? String(currentWeight) : EM_DASH}
          unit={currentWeight != null ? t.dashboard.kg : undefined}
          trend={hasWeightHistory ? weightTrend : undefined}
          onPress={onWeightPress}
        />
        <Tile
          symbol="calendar"
          color={Accent.red}
          label={t.dashboard.activeDays}
          value={activeDays > 0 ? String(activeDays) : EM_DASH}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.sm + Spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm + Spacing.xs,
  },
  tilePress: {
    flex: 1,
  },
  tile: {
    flex: 1,
    gap: Spacing.xs,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: {
    fontSize: 14,
    fontWeight: "500",
  },
  caption: {
    fontSize: 11,
  },
});
