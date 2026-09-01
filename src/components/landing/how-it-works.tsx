"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import { CalendarDays, Check, ChevronRight, ListChecks, Trophy, TrendingUp } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

/**
 * A scroll-driven walkthrough. On large screens the phone is sticky and swaps
 * screens as each step scrolls past the middle of the viewport; on small
 * screens every step carries its own screen.
 */

const STEPS = [
  {
    icon: CalendarDays,
    title: "Pick today's session",
    body: "Your active program knows what day it is. Open the app, confirm the day, and every exercise with its target sets is laid out.",
    screen: PlanScreen,
  },
  {
    icon: ListChecks,
    title: "Log sets in one tap",
    body: "Each row shows what you did last time and pre-fills it. Most sets are a single tap on the checkbox. The rest timer starts on its own.",
    screen: LogScreen,
  },
  {
    icon: Trophy,
    title: "Finish, collect your PRs",
    body: "Hit Finish and you land on a summary: duration, total volume, and every record you just set.",
    screen: TriumphScreen,
  },
  {
    icon: TrendingUp,
    title: "Watch the trend line",
    body: "Sessions become charts: e1RM and volume per lift, a strength index across everything, and a heatmap of what you've been hitting.",
    screen: ProgressScreen,
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 0.6", "end 0.6"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const ActiveScreen = STEPS[active].screen;

  return (
    <section id="how" className="scroll-mt-24 border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Four steps.{" "}
              <span className="lp-serif text-primary">Zero setup.</span>
            </>
          }
          body="No onboarding wizard, no email, no sync to wait for. The first workout is a minute away."
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Sticky phone (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-primary/15 blur-3xl" />
                <PhoneMockup>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, x: 24, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -24, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                    >
                      <ActiveScreen />
                    </motion.div>
                  </AnimatePresence>
                </PhoneMockup>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="relative">
            <div aria-hidden className="absolute bottom-6 left-[19px] top-6 hidden w-px bg-border lg:block">
              <motion.div style={{ scaleY: progress, originY: 0 }} className="h-full w-full bg-primary" />
            </div>
            <ol ref={listRef} className="space-y-10 lg:space-y-0">
              {STEPS.map((step, i) => (
                <Step key={step.title} index={i} step={step} active={active === i} onActive={setActive} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  index,
  step,
  active,
  onActive,
}: {
  index: number;
  step: (typeof STEPS)[number];
  active: boolean;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  const Icon = step.icon;
  const Screen = step.screen;

  return (
    <li ref={ref} className="relative lg:min-h-[52vh] lg:py-10">
      <div className="flex gap-5">
        <div
          className={cn(
            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-500",
            active
              ? "bg-primary text-primary-foreground ring-primary shadow-lg shadow-primary/30"
              : "bg-card text-muted-foreground ring-foreground/10"
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step {index + 1}
          </p>
          <h3
            className={cn(
              "mt-1.5 text-2xl font-semibold tracking-tight transition-colors duration-500 sm:text-3xl",
              active ? "text-foreground" : "text-foreground/70"
            )}
          >
            {step.title}
          </h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{step.body}</p>

          {/* Inline screen (mobile / tablet) */}
          <div className="mt-6 overflow-hidden rounded-3xl bg-background ring-1 ring-foreground/10 lg:hidden">
            <div className="h-[420px] overflow-hidden">
              <Screen compact />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ----------------------------- Screens --------------------------------- */

type ScreenProps = { compact?: boolean };

function Frame({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={cn("flex h-full flex-col gap-2.5 px-3 pb-3", compact ? "pt-3" : "")}>{children}</div>;
}

function PlanScreen({ compact }: ScreenProps) {
  return (
    <Frame compact={compact}>
      <div>
        <p className="text-lg font-bold text-foreground">Workout</p>
        <p className="text-[11px] text-muted-foreground">Push / Pull / Legs · 6 days a week</p>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-primary/40">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Push A</p>
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">Today</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Tuesday · 5 exercises</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      <ul className="divide-y divide-foreground/5 rounded-2xl bg-card ring-1 ring-foreground/10">
        {[
          ["Bench Press", "4 × 5–8"],
          ["Overhead Press", "3 × 8–10"],
          ["Incline DB Press", "3 × 8–12"],
          ["Lateral Raise", "3 × 12–15"],
          ["Triceps Pushdown", "3 × 10–12"],
        ].map(([n, t]) => (
          <li key={n} className="flex items-center justify-between px-3 py-2 text-[12px]">
            <span className="font-medium text-foreground">{n}</span>
            <span className="font-mono text-muted-foreground">{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30">
        Start workout
      </div>
    </Frame>
  );
}

function LogScreen({ compact }: ScreenProps) {
  return (
    <Frame compact={compact}>
      <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
        <div>
          <p className="font-mono text-base font-bold text-primary">12:04</p>
          <p className="text-[10px] text-muted-foreground">5/14 sets · 2,480 kg</p>
        </div>
        <span className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">Finish</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-card p-3 pl-4 ring-1 ring-primary/40">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary shadow-[0_0_14px_2px] shadow-primary/60" />
        <p className="text-sm font-semibold text-foreground">Bench Press</p>
        <ul className="mt-2 space-y-1.5">
          {[
            ["80 × 5", "82.5", "5", true],
            ["80 × 5", "82.5", "5", true],
            ["80 × 5", "82.5", "5", false],
            ["80 × 4", "82.5", "", false],
          ].map(([prev, w, r, done], i) => (
            <li key={i} className="grid grid-cols-[14px_1fr_44px_32px_20px] items-center gap-x-2 text-[11px]">
              <span className="font-mono text-muted-foreground">{i + 1}</span>
              <span className="text-muted-foreground/60">{prev as string}</span>
              <span className={cn("rounded-md bg-background px-1.5 py-0.5 font-mono ring-1 ring-foreground/15", !done && i === 2 && "text-muted-foreground/50")}>{w as string}</span>
              <span className={cn("rounded-md bg-background px-1.5 py-0.5 font-mono ring-1 ring-foreground/15", !(r as string) && "text-muted-foreground/50")}>{(r as string) || "5"}</span>
              <span className={cn("flex size-5 items-center justify-center rounded-md border", done ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25")}>
                {done && <Check className="size-3" strokeWidth={3} />}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
        <p className="text-sm font-semibold text-foreground">Overhead Press</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">3 sets · last time 50 × 8</p>
      </div>
      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-card px-3 py-2 ring-1 ring-foreground/10">
        <span className="font-mono text-sm font-bold text-primary">01:12</span>
        <span className="flex-1 text-[10px] text-muted-foreground">Rest</span>
        <span className="rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">Skip</span>
      </div>
    </Frame>
  );
}

function TriumphScreen({ compact }: ScreenProps) {
  return (
    <Frame compact={compact}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
        >
          <Trophy className="size-9" />
        </motion.div>
        <p className="mt-5 text-xl font-bold text-foreground">Session complete</p>
        <p className="text-[11px] text-muted-foreground">Push A · Tuesday</p>
        <div className="mt-5 grid w-full grid-cols-2 gap-2">
          <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
            <p className="text-[10px] text-muted-foreground">Duration</p>
            <p className="whitespace-nowrap font-mono text-base font-bold text-foreground">48:12</p>
          </div>
          <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
            <p className="text-[10px] text-muted-foreground">Volume</p>
            <p className="whitespace-nowrap font-mono text-base font-bold text-foreground">6,140 kg</p>
          </div>
        </div>
        <div className="mt-2 w-full rounded-2xl bg-primary/10 p-3 text-left ring-1 ring-primary/20">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">New records</p>
          <ul className="mt-1.5 space-y-1 text-[11px]">
            {[
              ["Bench Press", "82.5 kg", "+2.5"],
              ["Overhead Press", "52.5 kg", "+2.5"],
            ].map(([n, v, d]) => (
              <li key={n} className="flex items-center justify-between">
                <span className="font-medium text-foreground">{n}</span>
                <span className="font-mono text-foreground">
                  {v} <span className="text-emerald-500">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl bg-secondary py-2.5 text-center text-sm font-semibold text-secondary-foreground">Done</div>
    </Frame>
  );
}

function ProgressScreen({ compact }: ScreenProps) {
  return (
    <Frame compact={compact}>
      <div>
        <p className="text-lg font-bold text-foreground">Progress</p>
        <div className="mt-2 flex gap-1 rounded-lg bg-muted p-0.5 text-[10px] font-semibold">
          {["General", "Exercises", "Body"].map((t, i) => (
            <span key={t} className={cn("flex-1 rounded-md py-1 text-center", i === 0 ? "bg-card text-foreground shadow" : "text-muted-foreground")}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-foreground">118%</span>
          <span className="text-[11px] font-medium text-emerald-500">+18% · 3M</span>
        </div>
        <svg viewBox="0 0 240 90" className="mt-2 h-auto w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="lp-area2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,78 C30,74 40,70 60,66 S90,58 120,50 S160,36 200,26 S225,18 240,12 L240,90 L0,90 Z" fill="url(#lp-area2)" />
          <motion.path
            d="M0,78 C30,74 40,70 60,66 S90,58 120,50 S160,36 200,26 S225,18 240,12"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Chest", "+22%"],
          ["Back", "+15%"],
          ["Legs", "+11%"],
        ].map(([p, d]) => (
          <div key={p} className="rounded-xl bg-card p-2 ring-1 ring-foreground/10">
            <p className="text-[9px] text-muted-foreground">{p}</p>
            <p className="font-mono text-xs font-bold text-emerald-500">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
        <p className="text-[10px] font-semibold text-muted-foreground">Muscle load · 7 days</p>
        <div className="mt-2 grid grid-cols-6 gap-1" aria-hidden>
          {[0.9, 0.7, 0.4, 0.8, 0.3, 0.5, 0.6, 0.2, 0.9, 0.4, 0.7, 0.3].map((v, i) => (
            <span key={i} className="h-4 rounded-sm bg-primary" style={{ opacity: 0.15 + v * 0.85 }} />
          ))}
        </div>
      </div>
    </Frame>
  );
}
