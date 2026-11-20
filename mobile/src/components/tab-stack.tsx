import { Stack } from "expo-router";
import type { ReactNode } from "react";

import { useTheme } from "@/hooks/use-theme";

type Props = {
  title: string;
  // Extra header content for the index screen, e.g. <Stack.Toolbar>.
  children?: ReactNode;
};

// Native stack for one tab: large-title iOS header (Liquid Glass on iOS 26).
export function TabStack({ title, children }: Props) {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.primary,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index">
        <Stack.Title large>{title}</Stack.Title>
        {children}
      </Stack.Screen>
    </Stack>
  );
}
