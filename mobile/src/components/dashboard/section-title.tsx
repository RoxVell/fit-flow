import { SymbolView, type SFSymbol } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  symbol: SFSymbol;
  title: string;
};

export function SectionTitle({ symbol, title }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <SymbolView name={symbol} size={16} tintColor={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
});
