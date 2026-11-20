import { SymbolView, type SFSymbol } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Centered empty/not-found state for the editor routes.
export function Notice({ symbol, title }: { symbol: SFSymbol; title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SymbolView name={symbol} size={40} tintColor={theme.textSecondary} />
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 15,
    textAlign: "center",
  },
});
