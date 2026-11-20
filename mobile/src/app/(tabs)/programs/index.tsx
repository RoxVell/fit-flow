import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { ExerciseLibraryList } from "@/components/exercises/exercise-library-list";
import { GlassButton } from "@/components/glass-button";
import { ProgramCard } from "@/components/programs/program-card";
import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useT } from "@/lib/i18n/locale-context";
import { listPrograms } from "@/lib/repositories/programs";

type ProgramsView = "programs" | "exercises";

export default function ProgramsScreen() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const router = useRouter();
  const [view, setView] = useState<ProgramsView>("programs");
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
      {programs.length === 0 ? (
        <Card style={styles.empty}>
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <SymbolView name="books.vertical" size={28} tintColor={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.programs.noProgramsYet}</Text>
          <GlassButton label={t.programs.createNew} symbol="plus" onPress={() => router.push("/programs/create")} />
        </Card>
      ) : (
        programs.map((program) => <ProgramCard key={program.id} program={program} />)
      )}
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
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
