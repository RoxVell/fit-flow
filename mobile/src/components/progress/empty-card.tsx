import { SymbolView, type SFSymbol } from "expo-symbols";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  symbol: SFSymbol;
  title: string;
  body?: string;
  /** Optional call to action rendered under the text. */
  children?: ReactNode;
};

export function EmptyCard({ symbol, title, body, children }: Props) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
        <SymbolView name={symbol} size={26} tintColor={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {body && <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>}
      {children && <View style={styles.cta}>{children}</View>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    textAlign: "center",
  },
  cta: {
    alignSelf: "stretch",
    marginTop: Spacing.sm,
  },
});
