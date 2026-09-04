import { StyleSheet, Text } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { USER_NAME, buildGreeting } from "@/lib/dashboard/greeting";
import { useT } from "@/lib/i18n/locale-context";

export function Greeting() {
  const t = useT();
  const theme = useTheme();
  const [before, after] = buildGreeting(t.dashboard.greetings, USER_NAME).split(USER_NAME);

  return (
    <Text style={[styles.text, { color: theme.text }]} accessibilityRole="header">
      {before}
      <Text style={{ color: theme.primary }}>{USER_NAME}</Text>
      {after}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts?.mono,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
  },
});
