import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

import { BodyView } from "@/components/progress/body-view";
import { ExercisesView } from "@/components/progress/exercises-view";
import { GeneralView } from "@/components/progress/general-view";
import { Screen } from "@/components/screen";
import { useScheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n/locale-context";
import { setProgressTab, useProgressTab } from "@/lib/progress/selected-tab";

export default function ProgressScreen() {
  const t = useT();
  const scheme = useScheme();
  const tab = useProgressTab();

  return (
    <Screen>
      <Host matchContents colorScheme={scheme}>
        <Picker
          label={t.progress.title}
          selection={tab}
          onSelectionChange={setProgressTab}
          modifiers={[pickerStyle("segmented"), labelsHidden()]}>
          <SwiftText modifiers={[tag("general")]}>{t.progress.general}</SwiftText>
          <SwiftText modifiers={[tag("exercises")]}>{t.progress.exercises}</SwiftText>
          <SwiftText modifiers={[tag("body")]}>{t.progress.body}</SwiftText>
        </Picker>
      </Host>
      {tab === "general" && <GeneralView />}
      {tab === "exercises" && <ExercisesView />}
      {tab === "body" && <BodyView />}
    </Screen>
  );
}
