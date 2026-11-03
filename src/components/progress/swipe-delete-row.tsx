"use client";

import { useRef } from "react";
import { m, useAnimationControls } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DELETE_WIDTH = 72;

interface SwipeDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

export function SwipeDeleteRow({ children, onDelete, className }: SwipeDeleteRowProps) {
  const open = useRef(false);
  const controls = useAnimationControls();
  const settle = (nextOpen: boolean) => {
    open.current = nextOpen;
    void controls.start({ x: nextOpen ? -DELETE_WIDTH : 0 });
  };

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
      <m.div
        drag="x"
        dragConstraints={{ left: -DELETE_WIDTH, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        animate={controls}
        onDragEnd={(_, { offset }) => {
          settle(open.current ? offset.x < DELETE_WIDTH / 2 : offset.x < -DELETE_WIDTH / 2);
        }}
        onTap={() => settle(false)}
        className="relative bg-card touch-pan-y"
      >
        {children}
      </m.div>
    </div>
  );
}
