"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCardioSession } from "@/lib/repositories/cardio";
import { calculatePace, formatPace } from "@/lib/utils/calculations";
import type { CardioType } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";

export function CardioForm({ onSuccess }: { onSuccess?: () => void }) {
  const [type, setType] = useState<CardioType>("run");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const t = useT();

  const durationSeconds = Number(minutes) * 60 + Number(seconds);
  const distKm = Number(distance);
  const avgHeartRate = heartRate === "" ? undefined : Number(heartRate);
  const pace = calculatePace(durationSeconds / 60, distKm);
  const canSave = Number.isFinite(distKm) && distKm > 0
    && Number.isFinite(durationSeconds) && durationSeconds > 0 && Number(minutes) >= 0 && Number(seconds) >= 0
    && (avgHeartRate === undefined || (Number.isSafeInteger(avgHeartRate) && avgHeartRate >= 0 && avgHeartRate <= 2147483647));

  const handleSubmit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await createCardioSession({
        type,
        distance: distKm,
        duration: durationSeconds,
        avgHeartRate,
        date: new Date().toISOString(),
      });
      onSuccess?.();
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.cardio.logCardio}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={type} onValueChange={(v) => setType(v as CardioType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="run">{t.cardio.types.run}</SelectItem>
            <SelectItem value="cycle">{t.cardio.types.cycle}</SelectItem>
            <SelectItem value="elliptical">{t.cardio.types.elliptical}</SelectItem>
            <SelectItem value="row">{t.cardio.types.row}</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <label htmlFor="cardio-distanceKm" className="text-xs text-muted-foreground">{t.cardio.distanceKm}</label>
          <Input
            id="cardio-distanceKm"
            min="0"
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={t.cardio.distancePlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="cardio-minutes" className="text-xs text-muted-foreground">{t.cardio.minutes}</label>
            <Input
              id="cardio-minutes"
              min="0"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="cardio-seconds" className="text-xs text-muted-foreground">{t.cardio.seconds}</label>
            <Input
              id="cardio-seconds"
              min="0"
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {pace > 0 && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.cardio.pace}</p>
            <p className="text-xl font-bold text-primary">{formatPace(pace)}</p>
          </div>
        )}

        <div>
          <label htmlFor="cardio-avgHeartRate" className="text-xs text-muted-foreground">{t.cardio.avgHeartRate}</label>
          <Input
            id="cardio-avgHeartRate"
            min="0"
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder={t.cardio.optional}
          />
        </div>

        {saveFailed && <p role="alert" className="text-sm text-destructive">{t.common.saveFailed}</p>}

        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={!canSave || saving}
        >
          {saving ? t.cardio.saving : t.cardio.save}
        </Button>
      </CardContent>
    </Card>
  );
}
