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

export function CardioForm({ onSuccess }: { onSuccess?: () => void }) {
  const [type, setType] = useState<CardioType>("run");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [saving, setSaving] = useState(false);

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
        <CardTitle className="text-lg">Log Cardio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={type} onValueChange={(v) => setType(v as CardioType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="run">Run</SelectItem>
            <SelectItem value="cycle">Cycle</SelectItem>
            <SelectItem value="elliptical">Elliptical</SelectItem>
            <SelectItem value="row">Row</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <label className="text-xs text-muted-foreground">Distance (km)</label>
          <Input
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="e.g. 5.0"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Minutes</label>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Seconds</label>
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
            <p className="text-xs text-muted-foreground">Pace</p>
            <p className="text-xl font-bold text-primary">{formatPace(pace)}</p>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Avg Heart Rate (bpm)</label>
          <Input
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={!distance || !minutes || saving}
        >
          {saving ? "Saving..." : "Save Cardio"}
        </Button>
      </CardContent>
    </Card>
  );
}
