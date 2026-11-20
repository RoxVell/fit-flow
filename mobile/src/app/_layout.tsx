import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { OfflineBanner } from "@/components/shared/offline-banner";
import { Colors } from "@/constants/theme";
import { getDb } from "@/lib/db/database";
import { useScheme } from "@/hooks/use-theme";
import { SettingsProvider } from "@/lib/settings/settings-context";
import { useSyncState } from "@/lib/sync/sync-service";

// Open, migrate and seed the database before the first render.
getDb();

export const unstable_settings = {
  anchor: "(tabs)",
};

const STACK_BACK_MINIMAL = { headerBackButtonDisplayMode: "minimal" as const };

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
        <SyncProvider>
        <ThemeProvider value={navTheme}>
          <View style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="workout/active"
                options={{ presentation: "fullScreenModal", gestureEnabled: false }}
              />
              <Stack.Screen name="workout/add-exercise" options={{ presentation: "modal" }} />
              <Stack.Screen name="workout/cardio" options={{ presentation: "modal" }} />
              <Stack.Screen name="workout/edit" options={{ presentation: "modal" }} />
              <Stack.Screen name="workout/exercise-history" options={{ presentation: "modal" }} />
              <Stack.Screen name="workout/history" options={STACK_BACK_MINIMAL} />
              <Stack.Screen name="progress/body-log" options={STACK_BACK_MINIMAL} />
              <Stack.Screen
                name="programs/(editor)"
                options={{ presentation: "modal", headerShown: false }}
              />
            </Stack>
            <OfflineBanner />
            <StatusBar style="auto" />
          </View>
        </ThemeProvider>
        </SyncProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

function SyncProvider({ children }: { children: ReactNode }) {
  useSyncState();
  return children;
}
