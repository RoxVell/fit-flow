import { useEffect, useRef, useState } from "react";
import { ActionSheetIOS, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SymbolView } from "expo-symbols";

import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { LoggedExercise, LoggedSet, SessionExercise } from "@/lib/db/types";
import { getExercise, getExerciseName } from "@/lib/exercises/catalog";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import {
  formatDecimalForInput,
  isPartialDecimalInput,
  isPartialIntegerInput,
  parseLocalizedDecimal,
} from "@/lib/utils/decimal-input";
import type { PreviousSet } from "@/lib/workout/previous-sets";
import { formatTarget } from "@/lib/workout/format";

const SWIPE_X = { activeOffsetX: [-20, 20] as [number, number], failOffsetY: [-12, 12] as [number, number] };

type Props = {
  index: number;
  exercise: LoggedExercise;
  planned?: SessionExercise;
  previousSets: (PreviousSet | null)[];
  isCurrent?: boolean;
  onToggleSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, data: Partial<LoggedSet>, options?: { propagateWeight?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemove: () => void;
  onSwap: () => void;
  onHistory: () => void;
  onUpdateExercise: (data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>) => void;
};

export function ActiveExerciseCard({
  index,
  exercise,
  planned,
  previousSets,
  isCurrent = false,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemove,
  onSwap,
  onHistory,
  onUpdateExercise,
}: Props) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const name = getExerciseName(exercise.exerciseId, locale, t.workout.unknownExercise);
  const bodyPart = getExercise(exercise.exerciseId)?.bodyPart;
  const [collapsed, setCollapsed] = useState(false);
  const excluded = Boolean(exercise.excludeFromStats);

  const openNote = () => {
    Alert.prompt(
      t.workout.exerciseNote,
      name,
      [
        { text: t.workout.cancel, style: "cancel" },
        {
          text: t.workout.saveNote,
          onPress: (value?: string) => onUpdateExercise({ notes: value?.trim() || undefined }),
        },
      ],
      "plain-text",
      exercise.notes ?? "",
    );
  };

  const openMenu = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: name,
        message: t.workout.exerciseMenu,
        options: [
          exercise.notes?.trim() ? t.workout.editNote : t.workout.addNote,
          excluded ? t.workout.includeInStats : t.workout.excludeFromStats,
          t.workout.swapExercise,
          t.workout.removeExercise,
          t.workout.cancel,
        ],
        cancelButtonIndex: 4,
        destructiveButtonIndex: 3,
      },
      (index) => {
        if (index === 0) openNote();
        if (index === 1) onUpdateExercise({ excludeFromStats: !excluded });
        if (index === 2) onSwap();
        if (index === 3) onRemove();
      },
    );
  };

  return (
    <Card style={[styles.card, styles.clip, isCurrent && { borderLeftWidth: 3, borderLeftColor: theme.primary }]}>
      <View style={styles.clip}>
        <Swipeable
          renderRightActions={() => <DeleteRail />}
          onSwipeableOpen={onRemove}
          overshootRight={false}
          rightThreshold={40}
          {...SWIPE_X}>
          <View style={[styles.header, { backgroundColor: theme.card }]}>
            <Text style={[styles.index, { color: theme.textSecondary }]}>{index}.</Text>
            <View style={styles.titleBlock}>
              <Pressable onPress={onHistory} hitSlop={4}>
                <Text style={[styles.name, styles.nameLink, { color: theme.text }]} numberOfLines={2}>
                  {name}
                </Text>
              </Pressable>
              <View style={styles.badges}>
                {bodyPart ? <Badge>{labelFor(BODY_PART_LABELS, bodyPart, locale)}</Badge> : null}
                {planned && <Badge>{formatTarget(planned.targetSets, planned.targetReps, t.workout.setsCount)}</Badge>}
                {excluded && <Badge variant="outline">{t.workout.excludedFromStatsShort}</Badge>}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.workout.exerciseMenu}
              onPress={openMenu}
              hitSlop={8}
              style={styles.collapse}>
              <SymbolView name="ellipsis" size={16} tintColor={theme.textSecondary} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setCollapsed((open) => !open)} hitSlop={8} style={styles.collapse}>
              <SymbolView name={collapsed ? "chevron.down" : "chevron.up"} size={16} tintColor={theme.textSecondary} />
            </Pressable>
          </View>
        </Swipeable>
      </View>

          {exercise.notes?.trim() ? (
            <Text style={[styles.note, { color: theme.textSecondary }]}>{exercise.notes.trim()}</Text>
          ) : null}

          {collapsed ? null : (
            <>
              <View style={styles.cols}>
                <Text style={[styles.colLabel, styles.setNo, { color: theme.textSecondary }]}>{t.workout.set}</Text>
                <Text style={[styles.colLabel, styles.prev, { color: theme.textSecondary }]}>{t.workout.previous}</Text>
                <Text style={[styles.colLabel, styles.inputCol, { color: theme.textSecondary }]}>{t.workout.kg}</Text>
                <Text style={[styles.colLabel, styles.times, { color: theme.textSecondary }]} />
                <Text style={[styles.colLabel, styles.inputCol, { color: theme.textSecondary }]}>{t.workout.reps}</Text>
                <View style={styles.check} />
              </View>

              {exercise.sets.map((set, setIndex) => (
                <SetRow
                  key={set.id}
                  set={set}
                  index={setIndex}
                  previous={previousSets[setIndex] ?? null}
                  exerciseName={name}
                  onToggle={() => onToggleSet(setIndex)}
                  onUpdate={(data, options) => onUpdateSet(setIndex, data, options)}
                  onRemove={() => onRemoveSet(setIndex)}
                  canRemove={exercise.sets.length > 1}
                />
              ))}

              <Pressable onPress={onAddSet} style={[styles.addSet, { borderTopColor: theme.border }]}>
                <SymbolView name="plus" size={14} tintColor={theme.textSecondary} />
                <Text style={[styles.addSetLabel, { color: theme.textSecondary }]}>{t.workout.addSet}</Text>
              </Pressable>
            </>
          )}
    </Card>
  );
}

function DeleteRail() {
  return (
    <View style={styles.deleteRail}>
      <SymbolView name="trash.fill" size={20} tintColor="#fff" />
    </View>
  );
}

type SetRowProps = {
  set: LoggedSet;
  index: number;
  previous: PreviousSet | null;
  exerciseName: string;
  onToggle: () => void;
  onUpdate: (data: Partial<LoggedSet>, options?: { propagateWeight?: boolean }) => void;
  onRemove: () => void;
  canRemove: boolean;
};

function SetRow({ set, index, previous, exerciseName, onToggle, onUpdate, onRemove, canRemove }: SetRowProps) {
  const t = useT();
  const theme = useTheme();
  const [weightText, setWeightText] = useState(() => formatDecimalForInput(set.weight));
  const [repsText, setRepsText] = useState(set.reps ? String(set.reps) : "");
  const prefilled = useRef(false);
  const weightFocused = useRef(false);

  useEffect(() => {
    if (!weightFocused.current) setWeightText(formatDecimalForInput(set.weight));
  }, [set.weight]);

  useEffect(() => {
    setRepsText(set.reps ? String(set.reps) : "");
  }, [set.reps]);

  useEffect(() => {
    if (!prefilled.current && set.weight === 0 && set.reps === 0 && previous) {
      onUpdate({ weight: previous.weight, reps: previous.reps });
      prefilled.current = true;
    }
  }, [previous, set.weight, set.reps, onUpdate]);

  const canComplete = set.completed || (set.weight > 0 && set.reps > 0);

  const row = (
    <View style={[styles.setRow, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={[styles.setNo, styles.setIndex, { color: theme.textSecondary }]}>{index + 1}</Text>
      <Text style={[styles.prev, styles.prevValue, { color: theme.textSecondary }]}>
        {previous ? `${previous.weight}×${previous.reps}` : t.common.emDash}
      </Text>
      <TextInput
        accessibilityLabel={t.workout.setWeightLabel(exerciseName, index + 1)}
        keyboardType="decimal-pad"
        value={weightText}
        onFocus={() => {
          weightFocused.current = true;
          if (!set.completed) {
            setWeightText("");
            onUpdate({ weight: 0 });
          }
        }}
        onChangeText={(value) => {
          if (!isPartialDecimalInput(value)) return;
          setWeightText(value);
          if (value !== "" && !value.endsWith(".") && !value.endsWith(",")) {
            onUpdate({ weight: parseLocalizedDecimal(value) });
          }
        }}
        onBlur={() => {
          weightFocused.current = false;
          const parsed = parseLocalizedDecimal(weightText);
          onUpdate({ weight: parsed }, { propagateWeight: true });
          setWeightText(formatDecimalForInput(parsed));
        }}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border },
          set.completed && styles.inputDone,
        ]}
      />
      <Text style={[styles.times, { color: theme.textSecondary }]}>×</Text>
      <TextInput
        accessibilityLabel={t.workout.setRepsLabel(exerciseName, index + 1)}
        keyboardType="number-pad"
        value={repsText}
        onFocus={() => {
          if (!set.completed) {
            setRepsText("");
            onUpdate({ reps: 0 });
          }
        }}
        onChangeText={(value) => {
          if (!isPartialIntegerInput(value)) return;
          setRepsText(value);
          onUpdate({ reps: value === "" ? 0 : Math.round(parseLocalizedDecimal(value)) });
        }}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border },
          set.completed && styles.inputDone,
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.workout.completeSet(exerciseName, index + 1)}
        disabled={!canComplete}
        onPress={onToggle}
        onLongPress={canRemove ? onRemove : undefined}
        style={[
          styles.checkBtn,
          {
            backgroundColor: set.completed ? theme.success : theme.muted,
            opacity: canComplete ? 1 : 0.4,
          },
        ]}>
        <Text style={[styles.checkMark, { color: set.completed ? theme.primaryForeground : theme.textSecondary }]}>
          {set.completed ? "✓" : ""}
        </Text>
      </Pressable>
    </View>
  );

  if (!canRemove) return row;

  return (
    <Swipeable
      renderRightActions={() => <DeleteRail />}
      onSwipeableOpen={onRemove}
      overshootRight={false}
      rightThreshold={40}
      {...SWIPE_X}>
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  clip: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  index: {
    width: 22,
    paddingTop: 2,
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  collapse: {
    paddingTop: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  nameLink: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  note: {
    fontSize: 13,
    fontStyle: "italic",
  },
  cols: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  setNo: {
    width: 22,
  },
  setIndex: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  prev: {
    width: 56,
  },
  prevValue: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  inputCol: {
    flex: 1,
    textAlign: "center",
  },
  times: {
    width: 12,
    textAlign: "center",
    fontSize: 14,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    textAlign: "center",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontFamily: Fonts?.rounded,
  },
  inputDone: {
    opacity: 0.7,
  },
  check: {
    width: 36,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 16,
    fontWeight: "700",
  },
  addSet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -Spacing.md,
  },
  addSetLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  deleteRail: {
    width: 72,
    flex: 1,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
