import { ScrollView, StyleSheet, type ScrollViewProps } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Scroll container for tab screens. `contentInsetAdjustmentBehavior`
// lets the native large-title header and tab bar inset the content.
export function Screen({ style, contentContainerStyle, ...props }: ScrollViewProps) {
  const theme = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      style={[{ backgroundColor: theme.background }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
});
