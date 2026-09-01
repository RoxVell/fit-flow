"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Pause, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A self-playing (and tappable) replica of the active-workout screen.
 *
 * The simulation checks off sets one by one, starts the rest timer after each,
 * pops a PR toast at the end and loops. Tapping a checkbox takes over: the
 * script pauses for a moment so the visitor's action is what they see.
 */

const SETS = [
  { prev: "80 × 5", weight: "82.5", reps: "5" },
  { prev: "80 × 5", weight: "82.5", reps: "5" },
  { prev: "80 × 5", weight: "82.5", reps: "5" },
  { prev: "80 × 4", weight: "82.5", reps: "5" },
];
const SET_VOLUME = 82.5 * 5;
const BASE_VOLUME = 1_860;
const BASE_SETS = 6;
const TOTAL_SETS = 14;
const REST_SECONDS = 90;
const BASE_ELAPSED = 24 * 60 + 18;

type Sim = { done: number; rest: number; pr: boolean; hold: number };

function tick(s: Sim): Sim {
  if (s.rest > 0) return { ...s, rest: Math.max(0, s.rest - 6) };
  if (s.hold > 0) return { ...s, hold: s.hold - 1 };
  if (s.done < SETS.length) {
    return { ...s, done: s.done + 1, rest: REST_SECONDS, hold: 4 };
  }
  if (!s.pr) return { ...s, pr: true, hold: 24 };
  return { done: 0, rest: 0, pr: false, hold: 8 };
}

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveLogger({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [sim, setSim] = useState<Sim>(() =>
    reduced ? { done: 3, rest: 0, pr: false, hold: 0 } : { done: 0, rest: 0, pr: false, hold: 10 }
  );
  const [elapsed, setElapsed] = useState(BASE_ELAPSED);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setSim(tick), 100);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const toggle = (index: number) => {
    setSim((s) => {
      const done = s.done === index + 1 ? index : index + 1;
      return { done, rest: done > s.done ? REST_SECONDS : 0, pr: false, hold: 28 };
    });
  };

  const volume = BASE_VOLUME + sim.done * SET_VOLUME;
  const setsDone = BASE_SETS + sim.done;

  return (
    <div ref={ref} className={cn("relative flex h-full flex-col gap-2.5 px-3 pb-3", className)}>
      {/* Sticky session header */}
      <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-mono text-base font-bold tabular-nums text-primary">{fmt(elapsed)}</p>
            <Pause className="size-3 text-primary/70" fill="currentColor" />
          </div>
          <Pop text={`${setsDone}/${TOTAL_SETS} sets · ${volume.toLocaleString("en-US")} kg`} />
        </div>
        <span className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
          Finish
        </span>
      </div>

      {/* Active exercise */}
      <div className="relative overflow-hidden rounded-2xl bg-card p-3 pl-4 ring-1 ring-primary/40">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary shadow-[0_0_14px_2px] shadow-primary/60" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Bench Press</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-secondary-foreground">
            Chest
          </span>
        </div>
        <div className="mt-2 grid grid-cols-[14px_1fr_44px_32px_20px] items-center gap-x-2 text-[9px] uppercase tracking-wide text-muted-foreground/70">
          <span>#</span>
          <span>Prev</span>
          <span>kg</span>
          <span>Reps</span>
          <span />
        </div>
        <ul className="mt-1 space-y-1">
          {SETS.map((set, i) => {
            const done = i < sim.done;
            const active = i === sim.done;
            return (
              <motion.li
                key={i}
                animate={{
                  backgroundColor: done
                    ? "color-mix(in oklch, var(--primary) 10%, transparent)"
                    : "color-mix(in oklch, var(--primary) 0%, transparent)",
                }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-[14px_1fr_44px_32px_20px] items-center gap-x-2 rounded-lg px-1 py-1 text-[11px]"
              >
                <span className="font-mono text-muted-foreground">{i + 1}</span>
                <span className="text-muted-foreground/60">{set.prev}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono tabular-nums ring-1",
                    done || active
                      ? "bg-background text-foreground ring-foreground/15"
                      : "bg-background/60 text-muted-foreground/60 ring-foreground/10"
                  )}
                >
                  {set.weight}
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono tabular-nums ring-1",
                    done || active
                      ? "bg-background text-foreground ring-foreground/15"
                      : "bg-background/60 text-muted-foreground/60 ring-foreground/10"
                  )}
                >
                  {set.reps}
                </span>
                <motion.button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-label={`${done ? "Uncheck" : "Complete"} set ${i + 1}`}
                  animate={done ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md border transition-colors",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/25 bg-background hover:border-primary"
                  )}
                >
                  <AnimatePresence>
                    {done && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
        <div className="mt-1.5 text-center text-[10px] font-medium text-primary">+ Add set</div>
      </div>

      {/* Next exercise, idle */}
      <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Incline DB Press</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-secondary-foreground">
            Chest
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">3 sets · last time 30 × 8</p>
      </div>

      {/* Rest timer */}
      <div className="mt-auto">
        <AnimatePresence mode="popLayout">
          {sim.rest > 0 ? (
            <motion.div
              key="rest"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2 shadow-lg shadow-foreground/10 ring-1 ring-foreground/10"
            >
              <Ring progress={sim.rest / REST_SECONDS} />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">Rest</p>
                <p className="font-mono text-sm font-bold tabular-nums text-foreground">{fmt(sim.rest)}</p>
              </div>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                Skip
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-foreground/20 py-2.5 text-center text-[11px] font-medium text-muted-foreground"
            >
              + Add exercise
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PR toast */}
      <AnimatePresence>
        {sim.pr && (
          <motion.div
            key="pr"
            role="status"
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute inset-x-3 top-14 z-20 flex items-center gap-2.5 rounded-2xl bg-foreground px-3 py-2.5 text-background shadow-2xl"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Trophy className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">New PR · Bench Press</p>
              <p className="text-[10px] opacity-70">82.5 kg × 5 · +2.5 kg</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Re-mounts on every change so the new value pops in. */
function Pop({ text }: { text: string }) {
  return (
    <motion.p
      key={text}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="font-mono text-[10px] tabular-nums text-muted-foreground"
    >
      {text}
    </motion.p>
  );
}

function Ring({ progress, size = 30 }: { progress: number; size?: number }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-150"
      />
    </svg>
  );
}
