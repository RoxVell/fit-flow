import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { MuscleWeights } from "@/components/exercises/muscle-weights";
import { Placeholder } from "@/components/placeholder";
import { Screen } from "@/components/screen";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getExercise } from "@/lib/exercises/catalog";
import {
  BODY_PART_LABELS,
  EQUIPMENT_LABELS,
  LATERALITY_LABELS,
  MECHANICS_LABELS,
  TAG_LABELS,
  labelFor,
} from "@/lib/exercises/labels";
import { pickLocalized } from "@/lib/exercises/locale";
import { useLocale, useT } from "@/lib/i18n/locale-context";

// Exercise detail pushed from the library list. Only manifest data is
// bundled; description, instructions and video come with the detail files.
export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const theme = useTheme();
  const exercise = getExercise(id);

  if (!exercise) {
    return (
      <Screen>
        <Stack.Title>{t.programs.exercisesTab}</Stack.Title>
        <Placeholder symbol="questionmark.circle" title={t.exercises.notFound} />
      </Screen>
    );
  }

  const name = pickLocalized(exercise.name, locale);
  const muscleWeights = exercise.muscleWeights ?? {};
  const hasMuscles = Object.values(muscleWeights).some((w) => w > 0);

  return (
    <Screen>
      <Stack.Title>{name}</Stack.Title>

      <ExerciseThumbnail uri={exercise.thumbnailUri} style={styles.hero} symbolSize={40} contentFit="contain" />

      <View style={styles.chips}>
        <Badge variant="primary">{labelFor(BODY_PART_LABELS, exercise.bodyPart, locale)}</Badge>
        {exercise.equipments.map((eq) => (
          <Badge key={eq}>{labelFor(EQUIPMENT_LABELS, eq, locale)}</Badge>
        ))}
        <Badge variant="outline">{labelFor(MECHANICS_LABELS, exercise.mechanics, locale)}</Badge>
        <Badge variant="outline">{labelFor(LATERALITY_LABELS, exercise.laterality, locale)}</Badge>
      </View>

      {hasMuscles && (
        <Card>
          <SectionTitle symbol="figure.strengthtraining.traditional" title={t.exercises.muscles} />
          <MuscleWeights weights={muscleWeights} />
        </Card>
      )}

      <Card>
        <SectionTitle symbol="info.circle" title={t.exercises.details} />
        <DetailRow label={t.exercises.mechanics} value={labelFor(MECHANICS_LABELS, exercise.mechanics, locale)} />
        <DetailRow
          label={t.exercises.equipment}
          value={exercise.equipments.map((eq) => labelFor(EQUIPMENT_LABELS, eq, locale)).join(", ") || "—"}
        />
        {exercise.tags.length > 0 && (
          <View style={styles.tags}>
            {exercise.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {labelFor(TAG_LABELS, tag, locale)}
              </Badge>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle symbol="play.rectangle" title={`${t.exercises.overview} · ${t.exercises.video}`} />
        <Text style={[styles.comingSoon, { color: theme.primary }]}>{t.common.comingSoon}</Text>
      </Card>
    </Screen>
  );
}

function SectionTitle({ symbol, title }: { symbol: SFSymbol; title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <SymbolView name={symbol} size={18} tintColor={theme.primary} />
      <Text style={[styles.sectionText, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  comingSoon: {
    fontFamily: Fonts?.mono,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
