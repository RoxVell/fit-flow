import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ExerciseLibraryList } from "@/components/exercises/exercise-library-list";
import { ProgramCard } from "@/components/programs/program-card";
import { Screen } from "@/components/screen";
import { Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useT } from "@/lib/i18n/locale-context";
import { listPrograms } from "@/lib/repositories/programs";

type View = "programs" | "exercises";

export default function ProgramsScreen() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const [view, setView] = useState<View>("programs");
  const programs = useLiveQuery(listPrograms, [TABLES.programs]);

  const picker = (
    <Host matchContents colorScheme={scheme}>
      <Picker
        label={t.programs.title}
        selection={view}
        onSelectionChange={setView}
        modifiers={[pickerStyle("segmented"), labelsHidden()]}>
        <SwiftText modifiers={[tag("programs")]}>{t.programs.title}</SwiftText>
        <SwiftText modifiers={[tag("exercises")]}>{t.programs.exercisesTab}</SwiftText>
      </Picker>
    </Host>
  );

  // The exercise library is a FlatList and owns the screen's scrolling.
  if (view === "exercises") {
    return <ExerciseLibraryList header={picker} />;
  }

  return (
    <Screen>
      {picker}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.programs.yourPrograms}</Text>
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: Spacing.xs,
    marginBottom: -Spacing.sm,
  },
});
