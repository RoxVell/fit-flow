import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { ExerciseVideo } from "@/components/exercises/exercise-video";
import { MuscleWeights } from "@/components/exercises/muscle-weights";
import { EmptyCard } from "@/components/progress/empty-card";
import { MuscleHeatmap } from "@/components/progress/muscle-heatmap";
import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { MuscleGroup } from "@/lib/db/types";
import { getExercise } from "@/lib/exercises/catalog";
import { getExerciseDetail } from "@/lib/exercises/details";
import {
  BODY_PART_LABELS,
  EQUIPMENT_LABELS,
  LATERALITY_LABELS,
  MECHANICS_LABELS,
  labelFor,
} from "@/lib/exercises/labels";
import { pickLocalized, pickLocalizedList } from "@/lib/exercises/locale";
import { formatMuscleName, toBodyMuscleLoad, topMuscles } from "@/lib/exercises/muscle-map";
import { useLocale, useT } from "@/lib/i18n/locale-context";

type DetailTab = "overview" | "instructions" | "tips" | "mistakes" | "muscles";

function weightsToHeatmap(weights: Partial<Record<MuscleGroup, number>>): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const [group, percent] of Object.entries(weights) as [MuscleGroup, number][]) {
    if (!percent) continue;
    out[group] = Math.min(4, Math.max(1, Math.round(percent / 30)));
  }
  return out;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const theme = useTheme();
  const [tab, setTab] = useState<DetailTab>("overview");
  const exercise = getExercise(id);

  if (!exercise) {
    return (
      <Screen>
        <Stack.Title>{t.programs.exercisesTab}</Stack.Title>
        <EmptyCard symbol="questionmark.circle" title={t.exercises.notFound} />
      </Screen>
    );
  }

  const name = pickLocalized(exercise.name, locale);
  const muscleWeights = exercise.muscleWeights ?? {};
  const detail = getExerciseDetail(exercise.id, exercise.bodyPart);
  const namedMuscles = detail?.exerciseMuscles ? topMuscles(detail.exerciseMuscles) : [];
  const bodyLoad = detail?.exerciseMuscles ? toBodyMuscleLoad(detail.exerciseMuscles) : undefined;
  const muscleBars =
    namedMuscles.length > 0
      ? namedMuscles.map((muscle) => ({ name: formatMuscleName(muscle.name), percent: muscle.percent }))
      : (Object.entries(muscleWeights) as [keyof typeof muscleWeights, number][])
          .filter(([, percent]) => percent > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([group, percent]) => ({ name: t.exercises.muscleGroups[group] ?? group, percent }));
  const hasMuscles = muscleBars.length > 0;
  const description = pickLocalized(detail?.description, locale);
  const instructions = pickLocalizedList(detail?.instructions, locale);
  const tips = pickLocalizedList(detail?.tips, locale);
  const mistakes = pickLocalizedList(detail?.commonMistakes, locale);
  const heroUri = detail?.imageUri || exercise.thumbnailUri;
  const hasVideo = Boolean(detail?.videoDarkUrl || detail?.videoLightUrl);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: t.exercises.overview },
    { id: "instructions", label: t.exercises.instructions },
    { id: "tips", label: t.exercises.tips },
    { id: "mistakes", label: t.exercises.mistakesTab },
    { id: "muscles", label: t.exercises.muscles },
  ];

  return (
    <Screen>
      <Stack.Title>{name}</Stack.Title>

      {hasVideo && detail ? (
        <ExerciseVideo
          videoDarkUrl={detail.videoDarkUrl}
          videoLightUrl={detail.videoLightUrl}
          poster={detail.thumbnail1Uri ?? heroUri}
        />
      ) : heroUri ? (
        <Image source={{ uri: heroUri }} style={styles.hero} contentFit="contain" />
      ) : (
        <ExerciseThumbnail uri={null} style={styles.hero} symbolSize={40} contentFit="contain" />
      )}

      <View style={styles.chips}>
        <Badge variant="primary">{labelFor(BODY_PART_LABELS, exercise.bodyPart, locale)}</Badge>
        {exercise.equipments.map((eq) => (
          <Badge key={eq}>{labelFor(EQUIPMENT_LABELS, eq, locale)}</Badge>
        ))}
        <Badge variant="outline">{labelFor(MECHANICS_LABELS, exercise.mechanics, locale)}</Badge>
        <Badge variant="outline">{labelFor(LATERALITY_LABELS, exercise.laterality, locale)}</Badge>
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.muted }]}>
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && { backgroundColor: theme.card }]}>
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, { color: active ? theme.primary : theme.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "overview" ? (
        <Card>
          <Text style={[styles.body, { color: theme.text }]}>{description || "—"}</Text>
        </Card>
      ) : null}

      {tab === "instructions" ? (
        <Card>
          {instructions.length > 0 ? (
            instructions.map((step, index) => (
              <Text key={index} style={[styles.body, { color: theme.text }]}>
                {index + 1}. {step}
              </Text>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary }]}>—</Text>
          )}
        </Card>
      ) : null}

      {tab === "tips" ? (
        <Card>
          {tips.length > 0 ? (
            tips.map((tip, index) => (
              <Text key={index} style={[styles.body, { color: theme.text }]}>
                • {tip}
              </Text>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary }]}>—</Text>
          )}
        </Card>
      ) : null}

      {tab === "mistakes" ? (
        <Card>
          {mistakes.length > 0 ? (
            mistakes.map((item, index) => (
              <Text key={index} style={[styles.body, { color: theme.text }]}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary }]}>—</Text>
          )}
        </Card>
      ) : null}

      {tab === "muscles" ? (
        <Card>
          {hasMuscles ? (
            <>
              <View style={[styles.bodies, { backgroundColor: theme.muted }]}>
                <MuscleHeatmap data={weightsToHeatmap(muscleWeights)} bodyLoad={bodyLoad} compact />
              </View>
              <MuscleWeights items={muscleBars} />
            </>
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary }]}>—</Text>
          )}
        </Card>
      ) : null}
    </Screen>
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
  tabs: {
    flexDirection: "row",
    borderRadius: Radius.md,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md - 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  bodies: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
