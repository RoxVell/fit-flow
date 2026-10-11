"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Flame, WifiOff } from "lucide-react";
import { Reveal } from "./reveal";

/*
 * A looping re-enactment of logging a bench session in the app:
 * sets check in one by one, a (time-compressed) rest timer runs between
 * them, and the last set trips the PR detector.
 */

const SETS = [
  { kg: "100", reps: 5 },
  { kg: "100", reps: 5 },
  { kg: "102.5", reps: 4 },
  { kg: "105", reps: 3 },
];

const REST_FROM = 90; // seconds shown; played back compressed
const REST_PLAYBACK_MS = 2400;
const SET_PAUSE_MS = 900;
const LOOP_PAUSE_MS = 3200;

type Phase = { done: number; resting: boolean; restLeft: number; pr: boolean };

const FINAL: Phase = { done: SETS.length, resting: false, restLeft: 0, pr: true };

function useLogLoop(active: boolean, reduced: boolean): Phase {
  const [phase, setPhase] = useState<Phase>({
    done: 0,
    resting: false,
    restLeft: 0,
    pr: false,
  });

  useEffect(() => {
    if (!active || reduced) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(setTimeout(res, ms));
      });

    (async () => {
      while (!cancelled) {
        setPhase({ done: 0, resting: false, restLeft: 0, pr: false });
        await wait(SET_PAUSE_MS);
        for (let i = 1; i <= SETS.length; i++) {
          if (cancelled) return;
          setPhase({ done: i, resting: false, restLeft: 0, pr: i === SETS.length });
          if (i === SETS.length) break;
          await wait(SET_PAUSE_MS);
          // Rest countdown, compressed: 90 s replayed in ~2.4 s.
          const steps = 30;
          for (let s = 0; s <= steps; s++) {
            if (cancelled) return;
            setPhase({
              done: i,
              resting: s < steps,
              restLeft: Math.round(REST_FROM * (1 - s / steps)),
              pr: false,
            });
            await wait(REST_PLAYBACK_MS / steps);
          }
        }
        await wait(LOOP_PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, reduced]);

  return reduced ? FINAL : phase;
}

function LogCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion() ?? false;
  const { done, resting, restLeft, pr } = useLogLoop(inView, reduced);

  return (
    <div ref={ref} className="fl-card relative overflow-hidden p-0">
      {/* App chrome: even the status bar says what matters — it works offline. */}
      <div className="flex items-center justify-between border-b border-[var(--fl-line)] px-5 py-3">
        <span className="fl-mono text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)]">
          18:47 · GYM
        </span>
        <span className="fl-mono flex items-center gap-1.5 text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)]">
          <WifiOff className="size-3" />
          OFFLINE — STILL LOGGING
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold">Bench press</h3>
          <span className="fl-mono text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)]">
            WEEK 5 · PUSH A
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {SETS.map((s, i) => {
            const isDone = i < done;
            return (
              <li
                key={i}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors duration-300 ${
                  isDone
                    ? "border-[var(--fl-line)] bg-[rgb(255_255_255/0.03)]"
                    : "border-dashed border-[var(--fl-line)] opacity-50"
                }`}
              >
                <span className="fl-mono text-sm">
                  <span className="text-[var(--fl-muted)]">SET {i + 1}</span>
                  <span className="mx-3 text-[var(--fl-muted)]">·</span>
                  {s.kg} kg × {s.reps}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full transition-colors duration-300 ${
                    isDone
                      ? "bg-[var(--fl-ember)] text-[#17100a]"
                      : "border border-[var(--fl-line)]"
                  }`}
                >
                  <AnimatePresence>
                    {isDone && (
                      <motion.span
                        initial={reduced ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex h-10 items-center">
          <AnimatePresence mode="wait">
            {resting ? (
              <motion.div
                key="rest"
                className="flex w-full items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="fl-mono text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)]">
                  REST
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgb(255_255_255/0.07)]">
                  <div
                    className="h-full rounded-full bg-[var(--fl-ember)] transition-[width] duration-150 ease-linear"
                    style={{ width: `${(restLeft / REST_FROM) * 100}%` }}
                  />
                </div>
                <span className="fl-mono text-sm font-semibold tabular-nums">
                  {String(Math.floor(restLeft / 60)).padStart(2, "0")}:
                  {String(restLeft % 60).padStart(2, "0")}
                </span>
              </motion.div>
            ) : pr ? (
              <motion.div
                key="pr"
                className="fl-mono flex items-center gap-2 rounded-full bg-[var(--fl-ember)] px-4 py-1.5 text-[0.78rem] font-bold tracking-[0.1em] text-[#17100a]"
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 16 }}
              >
                <Flame className="size-4" />
                PR — e1RM 115.5 KG
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                className="fl-mono text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                NEXT SET WHEN READY
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function LiveLog() {
  return (
    <section id="log" className="fl-section px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal>
            <p className="fl-eyebrow">In the gym</p>
            <h2 className="fl-display mt-4 text-[clamp(2.4rem,5.5vw,4rem)]">
              Logged as it
              <br />
              happens
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-[var(--fl-muted)]">
              Chalked hands, 90 seconds between sets — the log has to keep up
              with you, not the other way around.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "One tap per set",
                  body: "Targets are pre-filled from your program. Hit the weight, tap done, put your hands back on the bar.",
                },
                {
                  title: "Rest timer starts itself",
                  body: "Finish a set and the countdown is already running — with the next target waiting on screen.",
                },
                {
                  title: "PRs found for you",
                  body: "Every set is checked against your history: best weight, best reps, best estimated one-rep max.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--fl-ember)]"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-[var(--fl-muted)]">
                      {f.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:justify-self-end lg:w-full lg:max-w-md">
          <LogCard />
        </Reveal>
      </div>
    </section>
  );
}
