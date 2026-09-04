import { Stack } from "expo-router";

import { isDraftDirty, useProgramDraft } from "@/components/program-form/store";
import { useTheme } from "@/hooks/use-theme";

export const unstable_settings = {
  initialRouteName: "create",
};

// Program editor flow: presented by the root stack as a sheet, with its own
// header stack for the session editor and exercise picker pushed inside it.
export default function ProgramEditorLayout() {
  const theme = useTheme();
  const dirty = isDraftDirty(useProgramDraft());

  return (
    <>
      <Stack.Screen options={{ presentation: "modal", headerShown: false, gestureEnabled: !dirty }} />
      <Stack
        screenOptions={{
          headerTintColor: theme.primary,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </>
  );
}
