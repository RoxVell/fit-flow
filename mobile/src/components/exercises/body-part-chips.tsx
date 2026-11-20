import { Pressable, ScrollView, StyleSheet } from "react-native";

import { Badge } from "@/components/badge";
import { Spacing } from "@/constants/theme";
import { BODY_PARTS, BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import type { BodyPart } from "@/lib/exercises/types";
import { useLocale, useT } from "@/lib/i18n/locale-context";

type Props = {
  value: BodyPart | null;
  onChange: (value: BodyPart | null) => void;
};

export function BodyPartChips({ value, onChange }: Props) {
  const t = useT();
  const { locale } = useLocale();

  const chips: { key: BodyPart | null; label: string }[] = [
    { key: null, label: t.exercises.all },
    ...BODY_PARTS.map((bp) => ({ key: bp, label: labelFor(BODY_PART_LABELS, bp, locale) })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {chips.map((chip) => {
        const selected = chip.key === value;
        return (
          <Pressable
            key={chip.key ?? "all"}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? null : chip.key)}
            hitSlop={4}>
            <Badge variant={selected ? "primary" : "outline"} style={styles.chip}>
              {chip.label}
            </Badge>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm + Spacing.xs,
    paddingVertical: 5,
  },
});
