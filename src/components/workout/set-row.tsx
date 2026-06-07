"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoggedSet, SetType } from "@/lib/db/types";
import { useT } from "@/lib/i18n/use-t";
import {
  formatDecimalForInput,
  isPartialDecimalInput,
  parseLocalizedDecimal,
} from "@/lib/utils/decimal-input";

interface SetRowProps {
  set: LoggedSet;
  setNumber: number;
  previousSet?: { weight: number; reps: number } | null;
  onUpdate: (data: Partial<LoggedSet>) => void;
  onRemove: () => void;
  onComplete: () => void;
}

export function SetRow({ set, setNumber, previousSet, onUpdate, onRemove, onComplete }: SetRowProps) {
  const t = useT();

  const setTypeConfig: Record<SetType, { label: string; color: string }> = {
    working: { label: t.workout.setTypeWorking, color: "bg-primary/15 text-primary border-primary/25" },
    warmup: { label: t.workout.setTypeWarmup, color: "bg-blue-500/15 text-blue-500 border-blue-500/25" },
    dropset: { label: t.workout.setTypeDropset, color: "bg-red-500/15 text-red-500 border-red-500/25" },
  };

  const cycleType = () => {
    const types: SetType[] = ["working", "warmup", "dropset"];
    const idx = types.indexOf(set.type);
    onUpdate({ type: types[(idx + 1) % types.length] });
  };

  const config = setTypeConfig[set.type];
  const hasPrefilled = useRef(false);
  const [weightText, setWeightText] = useState(() => formatDecimalForInput(set.weight));
  const isWeightFocused = useRef(false);

  useEffect(() => {
    if (!isWeightFocused.current) {
      setWeightText(formatDecimalForInput(set.weight));
    }
  }, [set.weight]);

  useEffect(() => {
    if (!hasPrefilled.current && set.weight === 0 && set.reps === 0 && previousSet) {
      onUpdate({ weight: previousSet.weight, reps: previousSet.reps });
      hasPrefilled.current = true;
    }
  }, [previousSet]);

  const hasRequired = set.weight > 0 && set.reps > 0;
  const canToggleComplete = set.completed || hasRequired;

  return (
    <div className="relative overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) onRemove();
        }}
        className="flex w-[calc(100%+72px)]"
      >
        <div className="flex items-center gap-1 border-t border-border/50 p-2 transition-colors w-[calc(100%-72px)] shrink-0">
          <span className="w-5 shrink-0 text-center text-sm font-medium text-muted-foreground/50">
            {setNumber}
          </span>

          <button onClick={cycleType} className="w-7 shrink-0">
            <Badge variant="outline" className={cn("w-full text-center text-[11px] px-0 py-0.5 font-medium", config.color)}>
              {config.label}
            </Badge>
          </button>

          {previousSet ? (
            <span className="text-sm text-foreground tabular-nums w-20 shrink-0 text-right text-muted-foreground/80">
              {previousSet.weight}×{previousSet.reps}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/50 w-20 shrink-0 text-right">{t.common.emDash}</span>
          )}

          <div className="flex-1" />

          <Input
            type="text"
            inputMode="decimal"
            value={weightText}
            onFocus={() => {
              isWeightFocused.current = true;
            }}
            onBlur={() => {
              isWeightFocused.current = false;
              const parsed = parseLocalizedDecimal(weightText);
              onUpdate({ weight: parsed });
              setWeightText(formatDecimalForInput(parsed));
            }}
            onChange={(e) => {
              const value = e.target.value;
              if (!isPartialDecimalInput(value)) return;
              setWeightText(value);
              if (value !== "" && !value.endsWith(",") && !value.endsWith(".")) {
                onUpdate({ weight: parseLocalizedDecimal(value) });
              }
            }}
            className="h-8 w-14 shrink-0 text-center text-sm tabular-nums px-1"
            placeholder="0"
          />

          <span className="text-muted-foreground/40 text-xs shrink-0">×</span>

          <Input
            type="number"
            inputMode="numeric"
            value={set.reps || ""}
            onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
            className="h-8 w-10 shrink-0 text-center text-sm tabular-nums px-1"
            placeholder="0"
          />

          <button
            onClick={() => canToggleComplete && onComplete()}
            disabled={!canToggleComplete}
            className={cn(
              "ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
              set.completed
                ? "border-green-500 bg-green-500/15 text-green-500"
                : "border-muted-foreground/20 text-muted-foreground/30",
              canToggleComplete && !set.completed && "hover:border-green-500/50 hover:text-green-500/50"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        <div className="w-[72px] shrink-0 flex items-center justify-center bg-destructive">
          <Trash2 className="h-5 w-5 text-destructive-foreground" />
        </div>
      </motion.div>
    </div>
  );
}
