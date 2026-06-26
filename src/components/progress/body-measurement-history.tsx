"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { useBodyMeasurements } from "@/lib/hooks/use-data";
import { formatSnapshotSummary } from "@/lib/body-measurements/snapshot-summary";
import { deleteBodyMeasurement } from "@/lib/repositories/measurements";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SwipeDeleteRow } from "@/components/progress/swipe-delete-row";

export function BodyMeasurementHistory() {
  const t = useT();
  const { formatShortDate } = useFormat();
  const measurements = useBodyMeasurements();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const history = useMemo(() => {
    if (!measurements) return undefined;
    return [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [measurements]);

  if (history === undefined || history.length === 0) {
    return null;
  }

  const deleteTarget = deleteId
    ? history.find((entry) => entry.id === deleteId)
    : undefined;

  return (
    <>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t.progress.history}
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card divide-y">
          {history.map((entry) => (
            <HistoryRow
              key={entry.id}
              dateLabel={formatShortDate(entry.date)}
              summary={formatSnapshotSummary(entry, t.progress.snapshotSummary)}
              onDelete={() => setDeleteId(entry.id)}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title={t.progress.deleteSnapshotTitle}
        description={t.progress.deleteSnapshotDesc}
        confirmLabel={t.progress.deleteSnapshot}
        cancelLabel={t.workout.cancel}
        destructive
        pending={deleting}
        onConfirm={() => {
          if (!deleteId || deleting) return;
          setDeleting(true);
          void deleteBodyMeasurement(deleteId)
            .then(() => setDeleteId(null))
            .finally(() => setDeleting(false));
        }}
      >
        {deleteTarget && (
          <p className="text-sm text-muted-foreground">
            {formatShortDate(deleteTarget.date)} ·{" "}
            {formatSnapshotSummary(deleteTarget, t.progress.snapshotSummary)}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

function HistoryRow({
  dateLabel,
  summary,
  onDelete,
}: {
  dateLabel: string;
  summary: string;
  onDelete: () => void;
}) {
  return (
    <SwipeDeleteRow onDelete={onDelete}>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{dateLabel}</p>
          <p className="text-xs text-muted-foreground break-words">{summary}</p>
        </div>
      </div>
    </SwipeDeleteRow>
  );
}
