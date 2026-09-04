import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = Pick<PressableProps, "onPress" | "accessibilityLabel"> & {
  label: string;
  symbol?: SFSymbol;
};

const glassAvailable = isLiquidGlassAvailable();

// Primary CTA. Uses a tinted Liquid Glass capsule on iOS 26+ and a flat
// primary-colored capsule elsewhere.
export function GlassButton({ label, symbol, ...pressable }: Props) {
  const theme = useTheme();

  const content = (
    <View style={styles.content}>
      {symbol && <SymbolView name={symbol} size={20} tintColor={theme.primaryForeground} />}
      <Text style={[styles.label, { color: theme.primaryForeground }]}>{label}</Text>
    </View>
  );

  return (
    <Pressable accessibilityRole="button" {...pressable}>
      {({ pressed }) =>
        glassAvailable ? (
          <GlassView
            style={[styles.button, pressed && styles.pressed]}
            glassEffectStyle="regular"
            tintColor={theme.primary}
            isInteractive>
            {content}
          </GlassView>
        ) : (
          <View
            style={[styles.button, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
            {content}
          </View>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
  },
});
