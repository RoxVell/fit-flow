import { Stack, router } from "expo-router";

import { TabStack } from "@/components/tab-stack";
import { useT } from "@/lib/i18n/locale-context";

export default function Layout() {
  const t = useT();
  return (
    <TabStack title={t.nav.programs}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" onPress={() => router.push("/programs/create")} />
      </Stack.Toolbar>
    </TabStack>
  );
}
