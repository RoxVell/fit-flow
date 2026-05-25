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
  working: { label: "Work", color: "bg-primary/10 text-primary border-primary/20" },
  warmup: { label: "Warm", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  dropset: { label: "Drop", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export function SetRow({ set, setNumber, previousSet, onUpdate, onRemove, onComplete }: SetRowProps) {
  const cycleType = () => {
    const types: SetType[] = ["working", "warmup", "dropset"];
    const idx = types.indexOf(set.type);
    onUpdate({ type: types[(idx + 1) % types.length] });
  };

  const config = setTypeConfig[set.type];

  return (
    <div className="relative overflow-hidden rounded-xl">
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) onRemove();
        }}
        className="relative z-10 w-full"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-1.5 rounded-xl border bg-card p-2.5 transition-colors w-full">
          <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
            {setNumber}
          </span>

          <button onClick={cycleType} className="w-12 shrink-0">
            <Badge variant="outline" className={cn("w-full text-center text-[10px] px-1 py-0.5", config.color)}>
              {config.label}
            </Badge>
          </button>

          {previousSet ? (
            <span className="text-xs text-muted-foreground tabular-nums w-20 shrink-0 text-left">
              {previousSet.weight}×{previousSet.reps}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40 w-20 shrink-0 text-left">—</span>
          )}

          <div className="flex-1" />

          <Input
            type="number"
            value={set.weight || ""}
            onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
            className="h-8 w-16 shrink-0 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="kg"
          />

          <span className="w-3 shrink-0 text-center text-xs text-muted-foreground">×</span>

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
      </motion.div>

      <div className="absolute right-0 top-px bottom-px flex w-[72px] items-center justify-center rounded-r-xl bg-destructive pointer-events-none">
        <Trash2 className="h-5 w-5 text-destructive-foreground" />
      </div>
    </div>
  );
}
