"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  endTime: number | null;
  isRunning: boolean;
  onStop: () => void;
}

export function RestTimer({ endTime, isRunning, onStop }: RestTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning || !endTime) {
      setRemaining(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endTime, isRunning]);

  if (!isRunning || remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / 90;
  const circumference = 2 * Math.PI * 42;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-32 left-4 right-4 z-50 max-w-lg mx-auto"
    >
      <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-lg border">
        <div className="relative flex items-center justify-center">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--color-muted)" strokeWidth="6" />
            <circle
              cx="48" cy="48" r="42"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>
          <span className="absolute text-3xl font-bold tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-base font-medium flex items-center gap-1">
            <Clock className="h-5 w-5" />
            Rest
          </p>
          <p className="text-sm text-muted-foreground">Next set ready when timer ends</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onStop}>
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
