"use client";

import { useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DELETE_WIDTH = 72;

interface SwipeDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

export function SwipeDeleteRow({ children, onDelete, className }: SwipeDeleteRowProps) {
  const [offset, setOffset] = useState(0);
  const openRef = useRef(false);

  const bind = useDrag(
    ({ movement: [mx], last, tap }) => {
      if (tap && openRef.current) {
        setOffset(0);
        openRef.current = false;
        return;
      }

      if (mx > 0) {
        setOffset(0);
        return;
      }

      const next = Math.max(-DELETE_WIDTH, mx);
      setOffset(next);

      if (last) {
        if (next <= -DELETE_WIDTH / 2) {
          setOffset(-DELETE_WIDTH);
          openRef.current = true;
        } else {
          setOffset(0);
          openRef.current = false;
        }
      }
    },
    { axis: "x", filterTaps: true, pointer: { touch: true } }
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-destructive text-destructive-foreground"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div
        {...bind()}
        className="relative bg-card touch-pan-y"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
