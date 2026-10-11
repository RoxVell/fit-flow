"use client";

import { Trophy } from "lucide-react";
import type { PersonalRecord } from "@/lib/db/types";
import { formatCompact, formatNumber, formatRelative } from "@/lib/desktop/format";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDt } from "@/lib/i18n/use-dt";
import { EmptyState } from "@/components/desktop/ui";

const TYPE_COLOR: Record<string, string> = {
  weight: "#fbbf24",
  volume: "#38bdf8",
  estimated_1rm: "var(--color-chart-1)",
};

export function RecordsList({
  records,
  limit,
}: {
  records: PersonalRecord[];
  limit?: number;
}) {
  const dt = useDt();
  const locale = useLocale();
  const rows = limit ? records.slice(0, limit) : records;

  if (rows.length === 0) {
    return <EmptyState icon={Trophy} title={dt.panels.noData} />;
  }

  return (
    <ul className="divide-y divide-[var(--desk-line)]">
      {rows.map((record) => (
        <li key={record.id} className="flex items-center gap-3 px-4 py-2.5">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: TYPE_COLOR[record.type] ?? "var(--color-chart-1)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{record.exerciseName}</p>
            <p className="text-[0.625rem] text-muted-foreground">
              {dt.prTypes[record.type]} · {formatRelative(record.date, locale)}
            </p>
          </div>
          <span className="desk-num shrink-0 text-xs font-semibold">
            {record.type === "volume"
              ? formatCompact(record.value, locale)
              : formatNumber(record.value, locale, 1)}
            <span className="ml-1 font-normal text-muted-foreground">
              {dt.units.kg}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
