import { DatePicker, Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { environment, labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { atEndOfDay, atStartOfDay } from "@/lib/dashboard/date";
import { swiftLocaleIdentifier } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { getCompletedWorkoutLogsInRange } from "@/lib/repositories/workouts";
import {
  WORKOUT_EXPORT_PRESETS,
  buildWorkoutLogsCsv,
  createWorkoutExportRange,
  getWorkoutExportFilename,
  shareWorkoutLogsCsv,
  type WorkoutExportPreset,
} from "@/lib/workout/export-csv";

export function WorkoutExportCard() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const { locale } = useLocale();
  const initial = createWorkoutExportRange("1m");
  const [preset, setPreset] = useState<WorkoutExportPreset>("1m");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [exporting, setExporting] = useState(false);

  const applyPreset = (next: WorkoutExportPreset) => {
    setPreset(next);
    if (next === "custom") return;
    const range = createWorkoutExportRange(next);
    setFrom(range.from);
    setTo(range.to);
  };

  const exportLogs = async () => {
    if (from.getTime() > to.getTime()) {
      Alert.alert(t.workout.exportInvalidRange);
      return;
    }
    setExporting(true);
    try {
      const logs = getCompletedWorkoutLogsInRange(atStartOfDay(from), atEndOfDay(to));
      if (logs.length === 0) {
        Alert.alert(t.workout.exportEmpty);
        return;
      }
      const range = { from: atStartOfDay(from), to: atEndOfDay(to) };
      await shareWorkoutLogsCsv(buildWorkoutLogsCsv(logs, locale), getWorkoutExportFilename(range));
    } catch (err) {
      console.warn("[exportCsv]", err);
      Alert.alert(t.workout.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{t.workout.exportCsv}</Text>
      <Host matchContents colorScheme={scheme}>
        <Picker
          label={t.workout.exportPeriod}
          selection={preset}
          onSelectionChange={applyPreset}
          modifiers={[pickerStyle("segmented"), labelsHidden()]}>
          {WORKOUT_EXPORT_PRESETS.map((item) => (
            <SwiftText key={item} modifiers={[tag(item)]}>
              {t.workout.exportPresets[item]}
            </SwiftText>
          ))}
        </Picker>
      </Host>
      {preset === "custom" ? (
        <>
          <Host matchContents colorScheme={scheme}>
            <DatePicker
              title={t.workout.exportFrom}
              selection={from}
              onDateChange={(date) => setFrom(atStartOfDay(date))}
              modifiers={[environment("locale", swiftLocaleIdentifier(locale))]}
            />
          </Host>
          <Host matchContents colorScheme={scheme}>
            <DatePicker
              title={t.workout.exportTo}
              selection={to}
              onDateChange={(date) => setTo(atEndOfDay(date))}
              modifiers={[environment("locale", swiftLocaleIdentifier(locale))]}
            />
          </Host>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={exporting}
        onPress={() => void exportLogs()}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
        <Text style={[styles.buttonLabel, { color: theme.primary }]}>
          {exporting ? t.workout.exporting : t.workout.exportCsv}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
