"use client";

import { motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LoggedSet, SetType } from "@/lib/db/types";

interface SetRowProps {
  set: LoggedSet;
  setNumber: number;
  onUpdate: (data: Partial<LoggedSet>) => void;
  onRemove: () => void;
  onComplete: () => void;
}

const setTypeConfig: Record<SetType, { label: string; color: string }> = {
  working: { label: "Working", color: "bg-primary/10 text-primary border-primary/20" },
  warmup: { label: "Warmup", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  dropset: { label: "Drop", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export function SetRow({ set, setNumber, onUpdate, onRemove, onComplete }: SetRowProps) {
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
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-card p-3 transition-colors w-full"
          )}
        >
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

          <span className="w-6 text-center text-sm font-medium text-muted-foreground">
            {setNumber}
          </span>

          <button onClick={cycleType} className="shrink-0">
            <Badge variant="outline" className={cn("text-[10px]", config.color)}>
              {config.label}
            </Badge>
          </button>

          <div className="flex items-center gap-1.5 flex-1">
            <Input
              type="number"
              value={set.weight || ""}
              onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
              className="h-8 w-16 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="kg"
              />
            <span className="text-xs text-muted-foreground">×</span>
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
              className="h-8 w-14 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="reps"
            />
          </div>

          <button
            onClick={onComplete}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              set.completed
                ? "border-primary text-primary"
                : "border-muted-foreground/30 hover:border-primary/50"
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
