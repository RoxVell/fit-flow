import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { ProgramEntity } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { getDayLabels } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { deleteProgram, setActiveProgram } from "@/lib/repositories/programs";

type Props = { program: ProgramEntity };

export function ProgramCard({ program }: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const dayLabels = getDayLabels(locale);

  const confirmDelete = () => {
    Alert.alert(t.programs.deleteProgram, t.programs.deleteProgramConfirm(program.name), [
      { text: t.programs.cancel, style: "cancel" },
      { text: t.programs.delete, style: "destructive", onPress: () => deleteProgram(program.id) },
    ]);
  };

  // Native action sheet; the web app shows inline Edit/Delete buttons.
  const openActions = () => {
    const actions = [
      {
        label: t.programs.edit,
        run: () => router.push({ pathname: "/programs/create", params: { edit: program.id } }),
      },
      ...(program.isActive ? [] : [{ label: t.programs.setActive, run: () => setActiveProgram(program.id) }]),
      { label: t.programs.deleteProgram, run: confirmDelete, destructive: true },
    ];
    if (Platform.OS !== "ios") {
      actions[actions.length - 1].run();
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: program.name,
        options: [...actions.map((a) => a.label), t.programs.cancel],
        destructiveButtonIndex: actions.findIndex((a) => a.destructive),
        cancelButtonIndex: actions.length,
      },
      (index) => actions[index]?.run(),
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: program.isActive }}
          accessibilityLabel={`${t.programs.setActive}: ${program.name}`}
          onPress={() => !program.isActive && setActiveProgram(program.id)}
          hitSlop={8}>
          <SymbolView
            name={program.isActive ? "largecircle.fill.circle" : "circle"}
            size={22}
            tintColor={program.isActive ? theme.primary : theme.textSecondary}
          />
        </Pressable>
        <View style={styles.headerBody}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{program.name}</Text>
            {program.isActive && <Badge variant="primary">{t.programs.active}</Badge>}
          </View>
          {program.description ? (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{program.description}</Text>
          ) : null}
          <Badge>{t.programs.daysSessions(program.daysPerWeek, program.sessions.length)}</Badge>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t.programs.edit} onPress={openActions} hitSlop={8}>
          <SymbolView name="ellipsis.circle" size={22} tintColor={theme.textSecondary} />
        </Pressable>
      </View>

      {program.sessions.map((session) => (
        <View key={session.id} style={[styles.session, { borderTopColor: theme.border }]}>
          <View style={styles.sessionRow}>
            <Text style={[styles.day, { color: theme.textSecondary }]}>{dayLabels[session.dayOfWeek % 7]}</Text>
            <Text style={[styles.sessionName, { color: theme.text }]}>{session.name}</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {t.programs.exerciseShort(session.exercises.length)}
            </Text>
          </View>
          <View style={styles.chips}>
            {session.exercises.map((se) => (
              <Badge key={se.id} variant="outline">
                {getExerciseName(se.exerciseId, locale, t.programs.unknownExercise)}
              </Badge>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm + Spacing.xs,
    padding: Spacing.md,
  },
  headerBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  session: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    gap: Spacing.sm,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  day: {
    width: 36,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  count: {
    fontSize: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    paddingLeft: 36 + Spacing.sm,
  },
});
