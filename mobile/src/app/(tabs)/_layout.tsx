import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n/locale-context";
import { useActiveWorkout } from "@/lib/workout/use-active-workout";

export const unstable_settings = {
  initialRouteName: "dashboard",
};

// Native UITabBar: Liquid Glass and scroll-to-minimize on iOS 26.
// Mirrors src/components/shared/bottom-nav.tsx in the web app.
export default function TabsLayout() {
  const t = useT();
  const theme = useTheme();
  const { isActive } = useActiveWorkout();

  return (
    <NativeTabs
      tintColor={theme.primary}
      badgeBackgroundColor={theme.success}
      minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>{t.nav.dashboard}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          md="dashboard"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="workout"
        accessibilityLabel={isActive ? `${t.nav.workout}, ${t.nav.activeSession}` : t.nav.workout}>
        <NativeTabs.Trigger.Label>{t.nav.workout}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "dumbbell", selected: "dumbbell.fill" }}
          md="fitness_center"
        />
        {isActive && <NativeTabs.Trigger.Badge />}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="programs">
        <NativeTabs.Trigger.Label>{t.nav.programs}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
          md="library_books"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{t.nav.progress}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
          md="bar_chart"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.nav.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
