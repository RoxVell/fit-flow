"use client";

import type { MuscleGroup } from "@/lib/db/types";
import { useLocale } from "@/lib/stores/locale-store";
import {
  formatChartDate,
  formatHistoryDate,
  formatShortDate,
  getDayLabels,
  getDayOptions,
  muscleGroupLabel,
} from "./format";

export function useFormat() {
  const locale = useLocale();
  return {
    locale,
    dayLabels: getDayLabels(locale),
    dayOptions: getDayOptions(locale),
    formatShortDate: (iso: string) => formatShortDate(iso, locale),
    formatChartDate: (iso: string) => formatChartDate(iso, locale),
    formatHistoryDate: (iso: string) => formatHistoryDate(iso, locale),
    muscleGroupLabel: (group: MuscleGroup | string) =>
      muscleGroupLabel(group, locale),
  };
}
