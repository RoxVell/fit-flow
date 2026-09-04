import { DatePicker, Host } from "@expo/ui/swift-ui";
import { environment } from "@expo/ui/swift-ui/modifiers";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { swiftLocaleIdentifier } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { isPartialDecimalInput } from "@/lib/utils/decimal-input";
import {
  BODY_BILATERAL_METRIC_GROUPS,
  BODY_SINGLE_METRIC_FIELDS,
  dateToSnapshotIso,
  emptyMetricValues,
  parseMetricValues,
  todayDate,
} from "@/lib/progress/body";
import { setProgressTab } from "@/lib/progress/selected-tab";
import { BodyMeasurementValidationError, hasAnyBodyMetric, logBodyMeasurement } from "@/lib/repositories/measurements";

export default function BodyLogScreen() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const { locale } = useLocale();
  const router = useRouter();
  const [date, setDate] = useState(todayDate);
  const [values, setValues] = useState(emptyMetricValues);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof typeof values, value: string) => {
    if (!isPartialDecimalInput(value)) return;
    setValues((current) => ({ ...current, [field]: value }));
  };

  const canSave = hasAnyBodyMetric(parseMetricValues(values));

  const save = () => {
    setError(null);
    const parsed = parseMetricValues(values);
    if (!hasAnyBodyMetric(parsed)) {
      setError(t.progress.atLeastOneMetric);
      return;
    }
    try {
      logBodyMeasurement({ date: dateToSnapshotIso(date), ...parsed });
      setProgressTab("body");
      if (router.canDismiss()) router.dismissTo("/progress");
      else router.navigate("/progress");
    } catch (err) {
      if (err instanceof BodyMeasurementValidationError) setError(t.progress.atLeastOneMetric);
    }
  };

  return (
    <>
      <Stack.Title>{t.progress.logMeasurementTitle}</Stack.Title>
      <Screen keyboardShouldPersistTaps="handled">
        <Host matchContents colorScheme={scheme}>
          <DatePicker
            title={t.progress.measurementDate}
            selection={date}
            displayedComponents={["date"]}
            onDateChange={setDate}
            modifiers={[environment("locale", swiftLocaleIdentifier(locale))]}
          />
        </Host>

        {BODY_SINGLE_METRIC_FIELDS.map((field) => (
          <Field key={field} label={`${t.progress.bodyMeasurements[field]} (${t.progress[field === "weight" ? "kg" : "cm"]})`}>
            <TextInput
              value={values[field]}
              onChangeText={(value) => setField(field, value)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
            />
          </Field>
        ))}

        {BODY_BILATERAL_METRIC_GROUPS.map((group) => (
          <View key={group.labelKey} style={styles.group}>
            <Text style={[styles.groupLabel, { color: theme.text }]}>{t.progress.bodyMeasurements[group.labelKey]}</Text>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label={t.progress.left}>
                  <TextInput
                    value={values[group.left]}
                    onChangeText={(value) => setField(group.left, value)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                  />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label={t.progress.right}>
                  <TextInput
                    value={values[group.right]}
                    onChangeText={(value) => setField(group.right, value)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                  />
                </Field>
              </View>
            </View>
          </View>
        ))}

        {error ? <Text style={[styles.error, { color: theme.primary }]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={save}
          style={[styles.save, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.4 }]}>
          <Text style={[styles.saveLabel, { color: theme.primaryForeground }]}>{t.progress.save}</Text>
        </Pressable>
      </Screen>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  group: {
    gap: Spacing.sm,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  error: {
    fontSize: 14,
  },
  save: {
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  saveLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
});
