import type { PersonalRecordEntity } from "@/lib/db/types";

export type RecentPR = {
  record: PersonalRecordEntity;
  /** Gain over the previous PR of the same exercise and type; null for a first PR. */
  absDelta: number | null;
  pctDelta: number | null;
};

const time = (iso: string) => new Date(iso).getTime();

/** Newest PRs with their delta to the previous PR (web: RecentPRs component). */
export function selectRecentPRs(records: PersonalRecordEntity[], limit = 5): RecentPR[] {
  const sorted = [...records].sort((a, b) => time(b.date) - time(a.date));

  return sorted.slice(0, limit).map((record) => {
    const prev = sorted.find(
      (r) =>
        r.id !== record.id &&
        r.exerciseId === record.exerciseId &&
        r.type === record.type &&
        time(r.date) <= time(record.date),
    );
    const absDelta = prev ? record.value - prev.value : null;
    const pctDelta = prev && prev.value > 0 ? (record.value / prev.value - 1) * 100 : null;
    return { record, absDelta, pctDelta };
  });
}
