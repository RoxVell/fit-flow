import { SymbolView, type SFSymbol } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n/locale-context";

import { Card } from "./card";

type Props = {
  symbol: SFSymbol;
  title: string;
};

export function Placeholder({ symbol, title }: Props) {
  const theme = useTheme();
  const t = useT();
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
        <SymbolView name={symbol} size={28} tintColor={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.badge, { color: theme.primary }]}>{t.common.comingSoon}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t.common.placeholder}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  badge: {
    fontFamily: Fonts?.mono,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  body: {
    fontSize: 15,
    textAlign: "center",
  },
});
