import type { Locale } from "@/lib/exercises/types";

const TAG: Record<Locale, string> = { en: "en-US", ru: "ru-RU" };

export function formatNumber(value: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(TAG[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** 12 400 -> "12.4k", 1 240 000 -> "1.24M". Keeps tiles readable at a glance. */
export function formatCompact(value: number, locale: Locale): string {
  return new Intl.NumberFormat(TAG[locale], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSigned(value: number, locale: Locale, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return sign + formatNumber(value, locale, digits);
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

export function formatDay(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(TAG[locale], {
    day: "numeric",
    month: "short",
  });
}

export function formatFullDay(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(TAG[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatClock(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(TAG[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMonth(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(TAG[locale], { month: "short" });
}

/** "3d ago" / "2 нед. назад" — relative, coarse-grained. */
export function formatRelative(iso: string, locale: Locale): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const rtf = new Intl.RelativeTimeFormat(TAG[locale], { numeric: "auto" });
  if (days < 1) return rtf.format(0, "day");
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.round(days / 30), "month");
  return rtf.format(-Math.round(days / 365), "year");
}

export function weekdayLabels(locale: Locale): string[] {
  const base = new Date(2024, 0, 7); // a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toLocaleDateString(TAG[locale], { weekday: "narrow" });
  });
}
