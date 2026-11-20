import { StyleSheet, Text, View, type ViewProps } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = ViewProps & {
  children: string;
  variant?: "primary" | "secondary" | "outline";
};

export function Badge({ children, variant = "secondary", style, ...props }: Props) {
  const theme = useTheme();
  const colors = {
    primary: { backgroundColor: theme.primary, borderColor: theme.primary, color: theme.primaryForeground },
    secondary: { backgroundColor: theme.muted, borderColor: theme.muted, color: theme.text },
    outline: { backgroundColor: "transparent", borderColor: theme.border, color: theme.text },
  }[variant];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }, style]}
      {...props}>
      <Text style={[styles.text, { color: colors.color }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
