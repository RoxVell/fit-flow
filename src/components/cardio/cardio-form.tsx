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
  const t = useT();

  const totalMinutes = parseFloat(minutes) + parseFloat(seconds) / 60 || 0;
  const distKm = parseFloat(distance) || 0;
  const pace = calculatePace(totalMinutes, distKm);

  const handleSubmit = async () => {
    const duration = parseFloat(minutes) * 60 + parseFloat(seconds);
    if (!distance || !duration) return;
    setSaving(true);
    try {
      await createCardioSession({
        type,
        distance: parseFloat(distance),
        duration,
        avgHeartRate: heartRate ? parseInt(heartRate) : undefined,
        date: new Date().toISOString(),
      });
      onSuccess?.();
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
          <label className="text-xs text-muted-foreground">{t.cardio.distanceKm}</label>
          <Input
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={t.cardio.distancePlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{t.cardio.minutes}</label>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t.cardio.seconds}</label>
            <Input
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
          <label className="text-xs text-muted-foreground">{t.cardio.avgHeartRate}</label>
          <Input
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder={t.cardio.optional}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={!distance || !minutes || saving}
        >
          {saving ? t.cardio.saving : t.cardio.save}
        </Button>
      </CardContent>
    </Card>
  );
}
