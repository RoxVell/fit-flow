import type { Locale } from "@/lib/exercises/types";
import type { MuscleGroup } from "@/lib/db/types";

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
};

export function getDayLabels(locale: Locale): string[] {
  const base = new Date(2024, 0, 7); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toLocaleDateString(LOCALE_TAG[locale], { weekday: "short" });
  });
}

export function getDayOptions(locale: Locale) {
  const labels = getDayLabels(locale);
  return [1, 2, 3, 4, 5, 6, 0].map((value) => ({
    value,
    label: labels[value],
  }));
}

export function formatShortDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], {
    month: "short",
    day: "numeric",
  });
}

export function formatChartDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], {
    month: "short",
    day: "numeric",
  });
}

export function formatHistoryDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const MUSCLE_LABELS: Record<Locale, Record<MuscleGroup, string>> = {
  en: {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    biceps: "Biceps",
    triceps: "Triceps",
    forearms: "Forearms",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    abs: "Abs",
    traps: "Traps",
    hip_flexors: "Hip Flexors",
    full_body: "Full Body",
  },
  ru: {
    chest: "Грудь",
    back: "Спина",
    shoulders: "Плечи",
    biceps: "Бицепс",
    triceps: "Трицепс",
    forearms: "Предплечья",
    quads: "Квадрицепс",
    hamstrings: "Бицепс бедра",
    glutes: "Ягодицы",
    calves: "Икры",
    abs: "Пресс",
    traps: "Трапеции",
    hip_flexors: "Сгибатели бедра",
    full_body: "Всё тело",
  },
};

export function muscleGroupLabel(
  group: MuscleGroup | string,
  locale: Locale
): string {
  const labels = MUSCLE_LABELS[locale];
  return labels[group as MuscleGroup] ?? group;
}
