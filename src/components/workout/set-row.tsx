"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoggedSet, SetType } from "@/lib/db/types";

interface SetRowProps {
  set: LoggedSet;
  setNumber: number;
  previousSet?: { weight: number; reps: number } | null;
  onUpdate: (data: Partial<LoggedSet>) => void;
  onRemove: () => void;
  onComplete: () => void;
}

const setTypeConfig: Record<SetType, { label: string; color: string }> = {
  working: { label: "W", color: "bg-primary/15 text-primary border-primary/25" },
  warmup: { label: "U", color: "bg-blue-500/15 text-blue-500 border-blue-500/25" },
  dropset: { label: "D", color: "bg-red-500/15 text-red-500 border-red-500/25" },
};

export function SetRow({ set, setNumber, previousSet, onUpdate, onRemove, onComplete }: SetRowProps) {
  const cycleType = () => {
    const types: SetType[] = ["working", "warmup", "dropset"];
    const idx = types.indexOf(set.type);
    onUpdate({ type: types[(idx + 1) % types.length] });
  };

  const config = setTypeConfig[set.type];

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
        <div className="flex items-center gap-1 border-t border-border/80 bg-card p-2 transition-colors w-[calc(100%-72px)] shrink-0">
          <span className="w-5 shrink-0 text-center text-sm font-medium text-muted-foreground/50">
            {setNumber}
          </span>

          <button onClick={cycleType} className="w-7 shrink-0">
            <Badge variant="outline" className={cn("w-full text-center text-[11px] px-0 py-0.5 font-medium", config.color)}>
              {config.label}
            </Badge>
          </button>

          {previousSet ? (
            <span className="text-sm text-foreground tabular-nums w-20 shrink-0 text-right">
              {previousSet.weight}×{previousSet.reps}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/50 w-20 shrink-0 text-right">—</span>
          )}

          <div className="flex-1" />

          <Input
            type="number"
            value={set.weight || ""}
            onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
            className="h-8 w-16 shrink-0 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="kg"
          />

          <span className="w-3 shrink-0 text-center text-sm text-muted-foreground/40">×</span>

          <Input
            type="number"
            value={set.reps || ""}
            onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
            className="h-8 w-12 shrink-0 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="r"
          />

          <button
            onClick={onComplete}
            disabled={set.completed || set.weight === 0 || set.reps === 0}
            className={cn(
              "ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
              set.completed
                ? "border-primary text-primary"
                : "border-muted-foreground/30 hover:border-primary/50",
              (set.weight === 0 || set.reps === 0) && !set.completed && "opacity-30"
            )}
          >
            {set.completed && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        <div className="w-[72px] shrink-0 flex items-center justify-center bg-destructive">
          <Trash2 className="h-5 w-5 text-destructive-foreground" />
        </div>
      </motion.div>
    </div>
  );
}
