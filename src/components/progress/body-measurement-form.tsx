"use client";

import { useState } from "react";
import { ArrowLeft, Check, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  BODY_BILATERAL_METRIC_GROUPS,
  BODY_METRIC_FIELDS,
  BODY_SINGLE_METRIC_FIELDS,
  type BodyMetricField,
} from "@/lib/body-measurements/metrics";
import { dateInputToIso, todayDate } from "@/lib/body-measurements/snapshot-summary";
import {
  BodyMeasurementValidationError,
  logBodyMeasurement,
} from "@/lib/repositories/measurements";
import { useT } from "@/lib/i18n/use-t";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

interface BodyMeasurementFormProps {
  asPage?: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const METRIC_UNITS: Record<BodyMetricField, string> = {
  weight: "kg",
  chest: "cm",
  waist: "cm",
  leftArm: "cm",
  rightArm: "cm",
  leftThigh: "cm",
  rightThigh: "cm",
  leftCalf: "cm",
  rightCalf: "cm",
};

function emptyMetricValues(): Record<BodyMetricField, string> {
  return Object.fromEntries(BODY_METRIC_FIELDS.map((field) => [field, ""])) as Record<
    BodyMetricField,
    string
  >;
}

export function BodyMeasurementForm({
  asPage = false,
  onBack,
  onSuccess,
}: BodyMeasurementFormProps) {
  const t = useT();
  const locale = useLocale();
  const [date, setDate] = useState(todayDate);
  const [values, setValues] = useState(emptyMetricValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldLabels = {
    weight: t.progress.bodyMeasurements.weight.replace(/\s*\(.*\)$/, ""),
    chest: t.progress.bodyMeasurements.chest.replace(/\s*\(.*\)$/, ""),
    waist: t.progress.bodyMeasurements.waist.replace(/\s*\(.*\)$/, ""),
  };

  const hasAnyValue = BODY_METRIC_FIELDS.some((field) => values[field].trim() !== "");

  const handleSubmit = async () => {
    setError(null);
    const payload = {
      date: dateInputToIso(date),
      weight: parseOptionalNumber(values.weight),
      chest: parseOptionalNumber(values.chest),
      waist: parseOptionalNumber(values.waist),
      leftArm: parseOptionalNumber(values.leftArm),
      rightArm: parseOptionalNumber(values.rightArm),
      leftThigh: parseOptionalNumber(values.leftThigh),
      rightThigh: parseOptionalNumber(values.rightThigh),
      leftCalf: parseOptionalNumber(values.leftCalf),
      rightCalf: parseOptionalNumber(values.rightCalf),
    };

    setSaving(true);
    try {
      await logBodyMeasurement(payload);
      onSuccess?.();
    } catch (err) {
      if (err instanceof BodyMeasurementValidationError) {
        setError(t.progress.atLeastOneMetric);
      } else {
        setError(t.progress.atLeastOneMetric);
      }
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
        step="0.1"
        value={values[field]}
        onChange={(e) => setValues((current) => ({ ...current, [field]: e.target.value }))}
        placeholder="—"
        className="border-0 bg-muted/50 px-3 py-2 text-right text-sm tabular-nums"
        aria-label={
          sideLabel
            ? `${t.progress.bodyMeasurements[field]} (${sideLabel})`
            : t.progress.bodyMeasurements[field]
        }
      />
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{METRIC_UNITS[field]}</span>
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
                  {fieldLabels[field]}
                </label>
                {renderMetricInput(field)}
              </div>
            ))}

            {BODY_BILATERAL_METRIC_GROUPS.map((group) => (
              <div key={group.labelKey} className="px-4 py-3.5">
                <p className="mb-3 text-sm font-medium">{t.progress.bodyMeasurements[group.labelKey]}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  {renderMetricInput(group.left as BodyMetricField, t.progress.left)}
                  {renderMetricInput(group.right as BodyMetricField, t.progress.right)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">{t.progress.atLeastOneMetric}</p>
      </section>

      {error && <p className="px-1 text-sm text-destructive">{error}</p>}

      {!asPage && (
        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={!hasAnyValue || saving}
        >
          {t.programs.save}
        </Button>
      )}
    </div>
  );

  if (!asPage) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{t.progress.logMeasurementTitle}</h2>
          </div>
        </div>
        <div className="p-4">{formBody}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b bg-background/60 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors active:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.programs.back}
        </button>
        <h1 className="text-base font-semibold">{t.progress.logMeasurementTitle}</h1>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!hasAnyValue || saving}
          className={cn(
            "flex items-center gap-1 text-sm font-semibold transition-colors",
            hasAnyValue && !saving ? "text-primary" : "text-muted-foreground/30"
          )}
        >
          <Check className="h-4 w-4" />
          {t.programs.save}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6 pb-24">{formBody}</div>
      </div>
    </div>
  );
}
