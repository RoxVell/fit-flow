"use client";

import { useCallback, useMemo } from "react";
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

  const dayLabels = useMemo(() => getDayLabels(locale), [locale]);
  const dayOptions = useMemo(() => getDayOptions(locale), [locale]);

  const formatShortDateFn = useCallback(
    (iso: string) => formatShortDate(iso, locale),
    [locale]
  );
  const formatChartDateFn = useCallback(
    (iso: string) => formatChartDate(iso, locale),
    [locale]
  );
  const formatHistoryDateFn = useCallback(
    (iso: string) => formatHistoryDate(iso, locale),
    [locale]
  );
  const muscleGroupLabelFn = useCallback(
    (group: MuscleGroup | string) => muscleGroupLabel(group, locale),
    [locale]
  );

  return {
    locale,
    dayLabels,
    dayOptions,
    formatShortDate: formatShortDateFn,
    formatChartDate: formatChartDateFn,
    formatHistoryDate: formatHistoryDateFn,
    muscleGroupLabel: muscleGroupLabelFn,
  };
}
