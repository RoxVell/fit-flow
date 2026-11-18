"use client";

import { useState } from "react";
import { FormHeader } from "@/components/shared/form-header";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  BODY_BILATERAL_METRIC_GROUPS,
  BODY_METRIC_FIELDS,
  BODY_SINGLE_METRIC_FIELDS,
  type BodyMetricField,
  type BodyMetricValues,
} from "@/lib/body-measurements/metrics";
import { dateInputToIso, todayDate } from "@/lib/body-measurements/snapshot-summary";
import { logBodyMeasurement } from "@/lib/repositories/measurements";
import { useT } from "@/lib/i18n/use-t";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

interface BodyMeasurementFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function BodyMeasurementForm({
  onBack,
  onSuccess,
}: BodyMeasurementFormProps) {
  const t = useT();
  const locale = useLocale();
  const [date, setDate] = useState(todayDate);
  const [values, setValues] = useState<Partial<Record<BodyMetricField, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const metrics: BodyMetricValues = {};
  for (const field of BODY_METRIC_FIELDS) {
    const value = Number.parseFloat(values[field] ?? "");
    if (Number.isFinite(value)) metrics[field] = value;
  }
  const entered = Object.values(metrics);
  const canSave = entered.length > 0 && entered.every((value) => value >= 0) && !saving;

  const handleSubmit = async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await logBodyMeasurement({ date: dateInputToIso(date), ...metrics });
      onSuccess?.();
    } catch {
      setError(t.common.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const renderMetricInput = (field: BodyMetricField, sideLabel?: string) => (
    <div key={field} className={cn("flex items-center gap-2", sideLabel ? "flex-1" : "w-28")}>
      {sideLabel && (
        <span className="w-10 shrink-0 text-xs text-muted-foreground">{sideLabel}</span>
      )}
      <Input
        id={`measurement-${field}`}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.1"
        value={values[field] ?? ""}
        onChange={(e) => setValues((current) => ({ ...current, [field]: e.target.value }))}
        placeholder="—"
        className="border-0 bg-muted/50 px-3 py-2 text-right text-sm tabular-nums"
        aria-label={
          sideLabel
            ? `${t.progress.bodyMeasurements[field]} (${sideLabel})`
            : t.progress.bodyMeasurements[field]
        }
      />
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{field === "weight" ? "kg" : "cm"}</span>
    </div>
  );

  const formBody = (
    <div className="space-y-8">
      <section>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.progress.measurementDate}
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="px-4 py-3.5">
            <DatePicker value={date} onChange={setDate} locale={locale} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.progress.bodyMeasurementsTitle}
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y divide-border">
            {BODY_SINGLE_METRIC_FIELDS.map((field) => (
              <div key={field} className="flex items-center gap-3 px-4 py-3.5">
                <label
                  htmlFor={`measurement-${field}`}
                  className="min-w-0 flex-1 text-sm font-medium"
                >
                  {t.progress.bodyMeasurements[field].replace(/\s*\(.*\)$/, "")}
                </label>
                {renderMetricInput(field)}
              </div>
            ))}

            {BODY_BILATERAL_METRIC_GROUPS.map((group) => (
              <div key={group.labelKey} className="px-4 py-3.5">
                <p className="mb-3 text-sm font-medium">{t.progress.bodyMeasurements[group.labelKey]}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  {renderMetricInput(group.left, t.progress.left)}
                  {renderMetricInput(group.right, t.progress.right)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">{t.progress.atLeastOneMetric}</p>
      </section>

      {error && <p role="alert" className="px-1 text-sm text-destructive">{error}</p>}

    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FormHeader
        title={t.progress.logMeasurementTitle}
        saveLabel={saving ? t.workout.saving : t.programs.save}
        disabled={!canSave}
        onSave={handleSubmit}
        onBack={onBack}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6 pb-24">{formBody}</div>
      </div>
    </div>
  );
}
