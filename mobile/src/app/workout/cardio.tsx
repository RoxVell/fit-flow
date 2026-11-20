import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";
import { TABLES } from "@/lib/db/database";
import type { CardioType } from "@/lib/db/types";
import { useLiveQuery } from "@/lib/db/live-query";
import { formatDuration, formatShortDate } from "@/lib/dashboard/date";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { createCardioSession, listCardioSessions } from "@/lib/repositories/cardio";
import { isPartialDecimalInput, isPartialIntegerInput, parseLocalizedDecimal } from "@/lib/utils/decimal-input";

const TYPES: CardioType[] = ["run", "cycle", "elliptical", "row"];

function toNumber(value: string): number {
  return parseLocalizedDecimal(value);
}

function formatPace(durationSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0 || durationSeconds <= 0) return "—";
  const minPerKm = durationSeconds / 60 / distanceKm;
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} / km`;
}

export default function CardioScreen() {
  const t = useT();
  const theme = useTheme();
  const scheme = useScheme();
  const router = useRouter();
  const { locale } = useLocale();
  const sessions = useLiveQuery(listCardioSessions, [TABLES.cardioSessions]);

  const [type, setType] = useState<CardioType>("run");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [heartRate, setHeartRate] = useState("");

  const durationSeconds = toNumber(minutes) * 60 + toNumber(seconds);
  const distKm = toNumber(distance);
  const canSave = distKm > 0 && durationSeconds > 0;

  const save = () => {
    if (!canSave) return;
    createCardioSession({
      type,
      distance: distKm,
      duration: durationSeconds,
      avgHeartRate: heartRate ? Math.round(toNumber(heartRate)) : undefined,
      date: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <>
      <Stack.Title>{t.cardio.title}</Stack.Title>
      <Screen>
        <Host matchContents colorScheme={scheme}>
          <Picker
            label={t.cardio.logCardio}
            selection={type}
            onSelectionChange={setType}
            modifiers={[pickerStyle("segmented")]}>
            {TYPES.map((value) => (
              <SwiftText key={value} modifiers={[tag(value)]}>
                {t.cardio.types[value]}
              </SwiftText>
            ))}
          </Picker>
        </Host>

        <Card>
          <Field label={t.cardio.distanceKm}>
            <TextInput
              value={distance}
              onChangeText={(value) => {
                if (isPartialDecimalInput(value)) setDistance(value);
              }}
              keyboardType="decimal-pad"
              placeholder="5.0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
            />
          </Field>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label={t.cardio.minutes}>
                <TextInput
                  value={minutes}
                  onChangeText={(value) => {
                    if (isPartialIntegerInput(value)) setMinutes(value);
                  }}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label={t.cardio.seconds}>
                <TextInput
                  value={seconds}
                  onChangeText={(value) => {
                    if (isPartialIntegerInput(value)) setSeconds(value);
                  }}
                  keyboardType="number-pad"
                  placeholder="00"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
                />
              </Field>
            </View>
          </View>
          <Field label={t.cardio.avgHeartRate}>
            <TextInput
              value={heartRate}
              onChangeText={(value) => {
                if (isPartialIntegerInput(value)) setHeartRate(value);
              }}
              keyboardType="number-pad"
              placeholder={t.cardio.optional}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border }]}
            />
          </Field>
          {distKm > 0 && durationSeconds > 0 ? (
            <Text style={[styles.pace, { color: theme.textSecondary }]}>
              {t.cardio.pace}: {formatPace(durationSeconds, distKm)}
            </Text>
          ) : null}
        </Card>

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={save}
          style={[styles.save, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.4 }]}>
          <Text style={[styles.saveLabel, { color: theme.primaryForeground }]}>{t.cardio.save}</Text>
        </Pressable>

        <Text style={[styles.section, { color: theme.textSecondary }]}>{t.cardio.history}</Text>
        {sessions.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>{t.cardio.noHistory}</Text>
        ) : (
          sessions.map((s) => (
            <Card key={s.id}>
              <View style={styles.historyRow}>
                <View style={styles.flex}>
                  <Text style={[styles.historyTitle, { color: theme.text }]}>{t.cardio.types[s.type]}</Text>
                  <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                    {formatShortDate(s.date, locale)} · {s.distance} {t.cardio.kmUnit} · {formatDuration(Math.max(1, Math.round(s.duration / 60)))}
                  </Text>
                </View>
                {s.avgHeartRate ? (
                  <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                    {s.avgHeartRate} {t.cardio.bpmUnit}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))
        )}
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
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
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
  pace: {
    fontSize: 13,
  },
  save: {
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyMeta: {
    fontSize: 13,
  },
});
