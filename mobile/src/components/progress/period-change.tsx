import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Accent } from "@/components/dashboard/accents";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatPeriodChange, type PeriodChange as Change } from "@/lib/charts/domain";

type Props = {
  change: Change;
  /** Unit for the absolute leg; omit to show only the percentage. */
  unit?: string;
  size?: "sm" | "lg";
};

/** Colored trend arrow + "+10 kg · +5.6%" (web: PeriodChangeIndicator). */
export function PeriodChangeLabel({ change, unit, size = "lg" }: Props) {
  const theme = useTheme();
  const positive = change.percent > 0;
  const neutral = change.percent === 0;
  const color = neutral ? theme.textSecondary : positive ? theme.success : Accent.red;
  const { absoluteLabel, percentLabel } = formatPeriodChange(change, unit ?? "");
  const label = unit ? `${absoluteLabel} · ${percentLabel}` : percentLabel;
  const fontSize = size === "lg" ? 20 : 13;

  return (
    <View style={styles.row}>
      {!neutral && (
        <SymbolView
          name={positive ? "arrow.up.right" : "arrow.down.right"}
          size={size === "lg" ? 18 : 12}
          tintColor={color}
          weight="bold"
        />
      )}
      <Text style={[styles.text, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

export function changeColor(value: number, theme: { success: string; textSecondary: string }): string {
  return value > 0 ? theme.success : value < 0 ? Accent.red : theme.textSecondary;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  text: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
