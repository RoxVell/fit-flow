import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Colors } from "@/constants/theme";
import { getDb } from "@/lib/db/database";
import { useScheme } from "@/hooks/use-theme";
import { SettingsProvider } from "@/lib/settings/settings-context";

// Open, migrate and seed the database before the first render.
getDb();

export const unstable_settings = {
  anchor: "(tabs)",
};

// Root stack hosts the tab bar; full-screen flows (active workout,
// exercise detail, program editor) will be pushed/presented on top of it.
export default function RootLayout() {
  const scheme = useScheme();
  const colors = Colors[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <ThemeProvider value={navTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="workout/active"
              options={{ presentation: "fullScreenModal", gestureEnabled: false }}
            />
            <Stack.Screen
              name="programs/(editor)"
              options={{ presentation: "modal", headerShown: false }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
