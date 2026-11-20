import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { SymbolView } from "expo-symbols";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n/locale-context";
import { formatRestDuration } from "@/lib/workout/rest-duration";

type Props = {
  remaining: number;
  duration: number;
  onSkip: () => void;
};

const RING = 56;
const STROKE = 3;

export function RestTimerBar({ remaining, duration, onSkip }: Props) {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const progress = duration > 0 ? remaining / duration : 0;
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
      <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING} style={styles.ring}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              fill="none"
              stroke={theme.muted}
              strokeWidth={STROKE}
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              fill="none"
              stroke={theme.primary}
              strokeWidth={STROKE}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[styles.time, { color: theme.text }]}>{formatRestDuration(remaining)}</Text>
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t.workout.restTimer}</Text>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" accessibilityLabel={t.workout.skipRest} onPress={onSkip} hitSlop={8} style={styles.skip}>
          <SymbolView name="forward.end.fill" size={16} tintColor={theme.textSecondary} />
          <Text style={[styles.skipLabel, { color: theme.textSecondary }]}>{t.workout.skipRest}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  time: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts?.rounded,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },
  skip: {
    minWidth: 36,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  skipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
