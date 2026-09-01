"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  Reorder,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  Bed,
  Check,
  ChevronsLeftRight,
  Database,
  Download,
  FileSpreadsheet,
  GripVertical,
  HeartPulse,
  Moon,
  Scale,
  Search,
  Smartphone,
  Sun,
  Trophy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { CountUp } from "./count-up";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * The feature bento. Each tile is a tiny, self-running demo of one thing the
 * app does. A single pointer listener on the grid drives the spotlight glow
 * on every tile via CSS custom properties.
 */
export function Bento() {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    for (const tile of e.currentTarget.querySelectorAll<HTMLElement>(".lp-tile")) {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--lp-x", `${e.clientX - r.left}px`);
      tile.style.setProperty("--lp-y", `${e.clientY - r.top}px`);
    }
  };

  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="What's in the box"
          title={
            <>
              Built for the gym floor,{" "}
              <span className="lp-serif text-primary">not the app store.</span>
            </>
          }
          body="Every tile below is live. Poke it."
        />

        <div
          onPointerMove={onMove}
          className="mt-16 grid auto-rows-[minmax(190px,auto)] grid-cols-1 gap-4 sm:grid-cols-6 lg:grid-cols-12"
        >
          <Tile className="sm:col-span-6 lg:col-span-7 lg:row-span-2" delay={0}>
            <OfflineTile />
          </Tile>
          <Tile className="sm:col-span-6 lg:col-span-5 lg:row-span-2" delay={0.05}>
            <ProgressTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-4" delay={0.1}>
            <PrTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-4" delay={0.15}>
            <LibraryTile />
          </Tile>
          <Tile className="sm:col-span-6 lg:col-span-4" delay={0.2}>
            <RestTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-6" delay={0.25}>
            <ProgramTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-6" delay={0.3}>
            <LocaleTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-3" delay={0.35}>
            <CsvTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-3" delay={0.4}>
            <BodyTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-3" delay={0.45}>
            <CardioTile />
          </Tile>
          <Tile className="sm:col-span-3 lg:col-span-3" delay={0.5}>
            <SyncTile />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className={cn("min-w-0", className)}>
      <article className="lp-tile group flex h-full flex-col overflow-hidden rounded-3xl bg-card/80 p-6 ring-1 ring-foreground/10 backdrop-blur transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
        {children}
      </article>
    </Reveal>
  );
}

function TileText({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Offline: flip the switch, watch sets queue up and flush.                  */

const LOGGED = [
  { name: "Bench Press", set: "82.5 × 5" },
  { name: "Incline DB Press", set: "30 × 8" },
  { name: "Cable Fly", set: "17.5 × 12" },
];

function OfflineTile() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [online, setOnline] = useState(false);
  const [touched, setTouched] = useState(false);

  // Auto-toggle until the visitor takes the wheel.
  useEffect(() => {
    if (!inView || touched || reduced) return;
    const id = window.setInterval(() => setOnline((v) => !v), 3800);
    return () => window.clearInterval(id);
  }, [inView, touched, reduced]);

  return (
    <div ref={ref} className="relative flex h-full flex-col">
      <TileText
        title="Zero bars? Zero problem."
        body="Your phone is the source of truth. Every set is written to the device first, so the basement gym feels exactly like full signal. Sync is optional and yours to configure."
      />

      <div className="relative mt-6 flex-1 rounded-2xl bg-background/70 p-4 ring-1 ring-foreground/10">
        {/* Faux status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SignalBars online={online} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={online ? "on" : "off"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={cn("text-xs font-semibold", online ? "text-emerald-500" : "text-muted-foreground")}
              >
                {online ? "Online · synced" : "No connection"}
              </motion.span>
            </AnimatePresence>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            aria-label="Toggle network"
            onClick={() => {
              setTouched(true);
              setOnline((v) => !v);
            }}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              online ? "bg-emerald-500" : "bg-foreground/20"
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "absolute top-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[10px] shadow",
                online ? "left-[22px]" : "left-0.5"
              )}
            >
              {online ? <Wifi className="size-3 text-emerald-600" /> : <WifiOff className="size-3 text-zinc-500" />}
            </motion.span>
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {LOGGED.map((row, i) => (
            <li
              key={row.name}
              className="flex items-center justify-between rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{row.set}</p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={online ? "synced" : "queued"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25, delay: online ? i * 0.12 : 0 }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    online ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {online ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                  {online ? "Synced" : "Saved locally"}
                </motion.span>
              </AnimatePresence>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {online ? "Outbox empty. Nothing to do." : "3 sets waiting for a signal. Keep lifting."}
        </p>
      </div>
    </div>
  );
}

function SignalBars({ online }: { online: boolean }) {
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[5, 8, 11, 14].map((h, i) => (
        <motion.span
          key={h}
          animate={{ opacity: online ? 1 : 0.25, scaleY: online ? 1 : 0.5 }}
          transition={{ delay: i * 0.06 }}
          style={{ height: h, originY: 1 }}
          className={cn("w-1 rounded-sm", online ? "bg-foreground" : "bg-foreground")}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Progress: the line draws itself when scrolled into view.                  */

const PERIODS = ["1M", "2M", "3M", "6M", "All"];
const LINE = "M0,92 C20,88 30,84 48,80 S80,72 100,64 S130,56 150,50 S185,38 210,30 S235,20 260,14";

function ProgressTile() {
  const [period, setPeriod] = useState("3M");
  return (
    <div className="flex h-full flex-col">
      <TileText
        title="Watch the line go up."
        body="A single strength index across every lift, plus e1RM and volume per exercise. 100% is your first week. Everything after that is you."
      />
      <div className="mt-6 flex-1 rounded-2xl bg-background/70 p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="whitespace-nowrap text-[11px] text-muted-foreground">Overall progress</p>
            <p className="mt-0.5 font-mono text-3xl font-bold tabular-nums text-foreground">
              <CountUp to={118} suffix="%" duration={2} />
            </p>
            <p className="whitespace-nowrap text-xs font-medium text-emerald-500">
              <CountUp to={18} prefix="+" suffix="%" duration={2} /> vs. week one
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5" role="tablist" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p}
                role="tab"
                type="button"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "relative rounded-md px-2 py-1 font-mono text-[10px] font-semibold transition-colors",
                  period === p ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {period === p && (
                  <motion.span
                    layoutId="lp-period"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{p}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.svg
          key={period}
          viewBox="0 0 260 110"
          className="mt-3 h-auto w-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 50, 80].map((y) => (
            <line key={y} x1="0" x2="260" y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" />
          ))}
          <motion.path
            d={`${LINE} L260,110 L0,110 Z`}
            fill="url(#lp-area)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.2 }}
          />
          <motion.path
            d={LINE}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.7, type: "spring", stiffness: 400, damping: 20 }}
            style={{ transformOrigin: "260px 14px" }}
          >
            <circle cx="260" cy="14" r="9" fill="var(--primary)" opacity="0.25" className="lp-ping" style={{ transformOrigin: "260px 14px" }} />
            <circle cx="260" cy="14" r="4.5" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" />
          </motion.g>
        </motion.svg>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>wk 1</span>
          <span>wk 6</span>
          <span>wk 12</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* PR: confetti on arrival, again on hover.                                  */

const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 34 + (i % 3) * 14;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 10,
    rotate: (i * 47) % 360,
    hue: i % 2 === 0 ? "bg-primary" : "bg-amber-300",
    shape: i % 3 === 0 ? "rounded-full" : "rounded-[2px]",
  };
});

function PrTile() {
  const [hovers, setHovers] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  // First burst fires on arrival, every hover after that adds one.
  const burst = inView ? hovers + 1 : 0;

  return (
    <div ref={ref} onPointerEnter={() => setHovers((h) => h + 1)} className="flex h-full flex-col">
      <div className="relative mx-auto flex size-20 items-center justify-center">
        <AnimatePresence>
          {burst > 0 &&
            PARTICLES.map((p, i) => (
              <motion.span
                key={`${burst}-${i}`}
                aria-hidden
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className={cn("absolute size-2", p.hue, p.shape)}
              />
            ))}
        </AnimatePresence>
        <motion.span
          key={burst}
          initial={{ scale: 0.7, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 14 }}
          className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/40"
        >
          <Trophy className="size-7" />
        </motion.span>
      </div>
      <div className="mt-4 text-center">
        <p className="font-mono text-sm font-semibold text-foreground">
          Bench Press · 82.5 kg
          <span className="ml-1.5 text-emerald-500">+2.5</span>
        </p>
      </div>
      <TileText
        className="mt-4 text-center"
        title="PRs, spotted for you."
        body="Weight, volume and e1RM records are detected the moment you finish a session."
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Library: a big number and two scrolling columns of exercise names.        */

const EXERCISES = [
  "Bench Press",
  "Romanian Deadlift",
  "Bulgarian Split Squat",
  "Lat Pulldown",
  "Overhead Press",
  "Pendlay Row",
  "Hip Thrust",
  "Face Pull",
  "Front Squat",
  "Hammer Curl",
  "Cable Crunch",
  "Nordic Curl",
  "Dips",
  "Leg Press",
];

function LibraryTile() {
  return (
    <div className="flex h-full flex-col">
      <p className="font-mono text-5xl font-bold tracking-tight text-foreground">
        <CountUp to={824} />
      </p>
      <TileText
        className="mt-2"
        title="Exercises, all offline."
        body="Illustrated, with target muscles and technique notes. Bundled with the app."
      />
      <div className="lp-marquee-pause lp-mask-y relative mt-4 h-36 shrink-0 overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((col) => (
            <ul
              key={col}
              className="lp-marquee-y space-y-2"
              style={{ "--lp-duration": col === 0 ? "22s" : "28s", animationDirection: col === 0 ? "normal" : "reverse" } as React.CSSProperties}
              aria-hidden
            >
              {[...EXERCISES, ...EXERCISES]
                .filter((_, i) => i % 2 === col)
                .map((name, i) => (
                  <li
                    key={`${name}-${i}`}
                    className="truncate rounded-lg bg-background/70 px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 ring-1 ring-foreground/10"
                  >
                    {name}
                  </li>
                ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Rest timer: a ring that loops 1:30 -> 0:00.                               */

const REST_TOTAL = 90;

function RestTile() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [left, setLeft] = useState(REST_TOTAL);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? REST_TOTAL : s - 1)), 110);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const size = 112;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const m = Math.floor(left / 60);
  const s = left % 60;

  return (
    <div ref={ref} className="flex h-full flex-col items-center sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - left / REST_TOTAL)}
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {m}:{String(s).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">rest</span>
        </div>
      </div>
      <TileText
        className="mt-4 text-center sm:mt-0 sm:text-left"
        title="Rest starts itself."
        body="Tick a set and the countdown begins, using the rest length set on your program. Skip it with one tap."
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Programs: pick a day, get that day's session, drag it into order.         */

type PlanItem = { id: string; name: string; target: string };
type Day = { d: string; full: string; s: string; plan: PlanItem[] };

const WEEK: Day[] = [
  {
    d: "Mon", full: "Monday", s: "Push",
    plan: [
      { id: "bp", name: "Bench Press", target: "4 × 5–8" },
      { id: "ohp", name: "Overhead Press", target: "3 × 8–10" },
      { id: "dip", name: "Dips", target: "3 × 8–12" },
    ],
  },
  {
    d: "Tue", full: "Tuesday", s: "Pull",
    plan: [
      { id: "row", name: "Pendlay Row", target: "4 × 5–8" },
      { id: "lat", name: "Lat Pulldown", target: "3 × 8–10" },
      { id: "fp", name: "Face Pull", target: "3 × 12–15" },
    ],
  },
  {
    d: "Wed", full: "Wednesday", s: "Legs",
    plan: [
      { id: "sq", name: "Back Squat", target: "4 × 5–8" },
      { id: "rdl", name: "Romanian Deadlift", target: "3 × 8–10" },
      { id: "lp", name: "Leg Press", target: "3 × 10–12" },
    ],
  },
  {
    d: "Thu", full: "Thursday", s: "Push",
    plan: [
      { id: "idb", name: "Incline DB Press", target: "4 × 8–10" },
      { id: "lr", name: "Lateral Raise", target: "3 × 12–15" },
      { id: "tp", name: "Triceps Pushdown", target: "3 × 10–12" },
    ],
  },
  {
    d: "Fri", full: "Friday", s: "Pull",
    plan: [
      { id: "cu", name: "Chin-up", target: "4 × 6–8" },
      { id: "cr", name: "Cable Row", target: "3 × 8–10" },
      { id: "hc", name: "Hammer Curl", target: "3 × 10–12" },
    ],
  },
  {
    d: "Sat", full: "Saturday", s: "Legs",
    plan: [
      { id: "fs", name: "Front Squat", target: "4 × 5–8" },
      { id: "ht", name: "Hip Thrust", target: "3 × 8–10" },
      { id: "nc", name: "Nordic Curl", target: "3 × 6–8" },
    ],
  },
  { d: "Sun", full: "Sunday", s: "Rest", plan: [] },
];

function ProgramTile() {
  const [day, setDay] = useState(1);
  const [touched, setTouched] = useState(false);
  const [plans, setPlans] = useState(() => WEEK.map((w) => w.plan));
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();

  // Walk the week until the visitor picks a day themselves.
  useEffect(() => {
    if (!inView || touched || reduced) return;
    const id = window.setInterval(() => setDay((d) => (d + 1) % WEEK.length), 2400);
    return () => window.clearInterval(id);
  }, [inView, touched, reduced]);

  const current = WEEK[day];
  const items = plans[day];
  const setItems = (next: PlanItem[]) =>
    setPlans((all) => all.map((p, i) => (i === day ? next : p)));

  return (
    <div ref={ref} className="flex h-full flex-col">
      <TileText
        title="Your split, your order."
        body="Start from Push / Pull / Legs or Upper / Lower, or build your own. Tap a day, drag the list. It's real."
      />

      <div className="mt-5 grid grid-cols-7 gap-1.5" role="tablist" aria-label="Weekday">
        {WEEK.map((w, i) => (
          <button
            key={w.d}
            type="button"
            role="tab"
            aria-selected={i === day}
            onClick={() => {
              setTouched(true);
              setDay(i);
            }}
            className={cn(
              "relative rounded-xl py-1.5 text-center ring-1 transition-colors",
              i === day
                ? "text-primary-foreground ring-primary"
                : "bg-background/70 text-foreground ring-foreground/10 hover:bg-muted",
              w.s === "Rest" && i !== day && "text-muted-foreground"
            )}
          >
            {i === day && (
              <motion.span
                layoutId="lp-day"
                className="absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/30"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative block text-[9px] uppercase tracking-wide opacity-70">{w.d}</span>
            <span className="relative block text-[11px] font-semibold">{w.s}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={day}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="font-medium text-foreground"
          >
            {current.full} ·{" "}
            <span className="text-primary">{current.s === "Rest" ? "Rest day" : `${current.s} ${day < 3 ? "A" : "B"}`}</span>
          </motion.p>
        </AnimatePresence>
        <span className="font-mono text-muted-foreground">
          {current.plan.length ? `${current.plan.length} exercises · rest 90s` : "recovery"}
        </span>
      </div>

      <div className="relative mt-2 min-h-[148px] flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {current.plan.length === 0 ? (
            <motion.div
              key="rest"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex h-full min-h-[148px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/15 bg-background/40 text-center"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Bed className="size-4.5" />
              </span>
              <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
              <p className="text-[11px] text-muted-foreground">Rest, or log some cardio.</p>
            </motion.div>
          ) : (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Reorder.Group
                axis="y"
                values={items}
                onReorder={setItems}
                className="space-y-1.5"
                aria-label={`${current.full} exercises, drag to reorder`}
              >
                {items.map((item) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    onDragStart={() => {
                      setTouched(true);
                      setDragging(true);
                    }}
                    onDragEnd={() => setDragging(false)}
                    whileDrag={{
                      scale: 1.03,
                      boxShadow: "0 12px 30px -10px color-mix(in oklch, var(--foreground) 35%, transparent)",
                    }}
                    className={cn(
                      "flex cursor-grab select-none items-center gap-2 rounded-xl bg-background/80 px-2.5 py-2 ring-1 ring-foreground/10 active:cursor-grabbing",
                      dragging && "touch-none"
                    )}
                  >
                    <GripVertical className="size-4 text-muted-foreground/60" />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">{item.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{item.target}</span>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Locale + theme: a before/after slider between EN·light and RU·dark.       */

const LIBRARY = [
  { en: "Bench Press", ru: "Жим лёжа", enPart: "Chest", ruPart: "Грудь", hue: "bg-primary" },
  { en: "Lat Pulldown", ru: "Тяга верхнего блока", enPart: "Back", ruPart: "Спина", hue: "bg-sky-500" },
  { en: "Back Squat", ru: "Приседания со штангой", enPart: "Legs", ruPart: "Ноги", hue: "bg-emerald-500" },
];

/**
 * Each language lives on its own side of the slider: English content is
 * left-aligned, Russian is right-aligned, so wherever the handle sits both
 * halves show real text instead of the empty end of the same row.
 */
function MiniLibrary({ dark, ru }: { dark: boolean; ru: boolean }) {
  const rtl = ru;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-2 p-3",
        dark ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      )}
    >
      <div className={cn("flex items-center justify-between", rtl && "flex-row-reverse")}>
        <p className="text-sm font-bold">{ru ? "Упражнения" : "Exercises"}</p>
        <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground">
          824
        </span>
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] ring-1",
          rtl && "flex-row-reverse",
          dark ? "bg-zinc-900 text-zinc-500 ring-white/10" : "bg-zinc-100 text-zinc-500 ring-zinc-900/5"
        )}
      >
        <Search className="size-3" />
        {ru ? "Поиск по названию" : "Search by name"}
      </div>
      <ul className="space-y-1.5">
        {LIBRARY.map((row) => (
          <li
            key={row.en}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1",
              rtl && "flex-row-reverse text-right",
              dark ? "bg-zinc-900 ring-white/10" : "bg-zinc-50 ring-zinc-900/5"
            )}
          >
            <span className={cn("size-6 shrink-0 rounded-md opacity-80", row.hue)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold">{ru ? row.ru : row.en}</span>
              <span className={cn("block text-[9px]", dark ? "text-zinc-400" : "text-zinc-500")}>
                {ru ? row.ruPart : row.enPart}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LocaleTile() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pos = useMotionValue(50);
  const clip = useTransform(pos, (v) => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(pos, (v) => `${v}%`);

  // Sway gently until the visitor grabs the handle.
  useEffect(() => {
    if (!inView || touched || reduced) return;
    const controls = animate(pos, [50, 70, 30, 50], {
      duration: 9,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [inView, touched, reduced, pos]);

  const setFromPointer = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    pos.set(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div className="flex h-full flex-col">
      <TileText
        title="Two languages. Two themes."
        body="Every exercise name is translated, not just the buttons. Light, dark or system. Drag the handle."
      />
      <div
        ref={ref}
        onPointerDown={(e) => {
          setTouched(true);
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e.clientX);
        }}
        onPointerMove={(e) => dragging && setFromPointer(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative mt-5 h-[232px] cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl ring-1 ring-foreground/10"
      >
        {/* Bottom layer: Russian, dark */}
        <div className="absolute inset-0">
          <MiniLibrary dark ru />
        </div>
        {/* Top layer: English, light, clipped to the handle */}
        <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
          <MiniLibrary dark={false} ru={false} />
        </motion.div>

        {/* Handle */}
        <motion.div
          role="slider"
          tabIndex={0}
          aria-label="Compare English light theme with Russian dark theme"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos.get())}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            setTouched(true);
            pos.set(Math.min(96, Math.max(4, pos.get() + (e.key === "ArrowLeft" ? -6 : 6))));
          }}
          style={{ left }}
          className="absolute inset-y-0 w-0 outline-none"
        >
          <div className="absolute inset-y-0 -left-px w-0.5 bg-primary shadow-[0_0_12px_2px] shadow-primary/50" />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-background transition-transform",
              dragging ? "scale-110" : "group-focus-visible:scale-110"
            )}
          >
            <ChevronsLeftRight className="size-4" />
          </div>
        </motion.div>
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Sun className="size-3" /> EN · Light</span>
        <span className="inline-flex items-center gap-1">RU · Dark <Moon className="size-3" /></span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* CSV export: rows stream into a file, then it's ready to download.         */

const CSV_ROWS = [
  ["2026-08-31", "Bench Press", "82.5 × 5"],
  ["2026-08-31", "Overhead Press", "52.5 × 8"],
  ["2026-08-29", "Back Squat", "120 × 5"],
];

function CsvTile() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  // 0..2 highlight rows, 3 = exported, then loop.
  const [phase, setPhase] = useState(reduced ? 3 : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 5), 900);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const done = phase >= 3;

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <FileSpreadsheet className="size-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">CSV export</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your whole history, any date range. Open it in Sheets, Excel or a notebook.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl bg-background/70 ring-1 ring-foreground/10">
        <div className="grid grid-cols-[1fr_1.2fr_0.9fr] gap-x-2 border-b border-foreground/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
          <span>date</span>
          <span>exercise</span>
          <span className="text-right">kg × reps</span>
        </div>
        {CSV_ROWS.map((row, i) => (
          <motion.div
            key={row.join()}
            animate={{
              backgroundColor:
                i === phase
                  ? "color-mix(in oklch, var(--primary) 14%, transparent)"
                  : "color-mix(in oklch, var(--primary) 0%, transparent)",
            }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-[1fr_1.2fr_0.9fr] gap-x-2 px-2.5 py-1.5 font-mono text-[10px] text-foreground/85"
          >
            <span className="truncate">{row[0]}</span>
            <span className="truncate">{row[1]}</span>
            <span className="truncate text-right">{row[2]}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3">
        <span className="min-w-0 flex-1 font-mono text-[11px] leading-tight text-foreground">
          <span className="block truncate">workouts.csv</span>
          <span className="block text-[10px] text-muted-foreground">1,284 rows · 14 months</span>
        </span>
        <motion.span
          animate={done ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors",
            done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-primary text-primary-foreground"
          )}
        >
          {done ? <Check className="size-3" strokeWidth={3} /> : <Download className="size-3" />}
          {done ? "Ready" : "Export"}
        </motion.span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Body: a weight sparkline that draws itself.                                */

const WEIGHT = "M0,26 C12,24 20,30 32,28 S52,20 64,22 S84,14 96,16 S116,8 128,10 S148,6 160,4";

function BodyTile() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Scale className="size-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Body measurements</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Weight, chest, waist, arms, thighs and calves. Optional, backdatable, charted.
      </p>

      <div className="mt-4 rounded-xl bg-background/70 p-3 ring-1 ring-foreground/10">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
            <CountUp to={78.4} decimals={1} /> <span className="text-sm font-medium text-muted-foreground">kg</span>
          </p>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            −0.6 / 30d
          </span>
        </div>
        <svg viewBox="0 0 160 32" className="mt-2 h-10 w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
          <motion.path
            d={WEIGHT}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <motion.circle
            cx="160"
            cy="4"
            r="3"
            fill="var(--primary)"
            stroke="var(--background)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.3, type: "spring", stiffness: 400, damping: 18 }}
            style={{ transformOrigin: "160px 4px" }}
          />
        </svg>
      </div>

      <ul className="mt-auto grid grid-cols-3 gap-1.5 pt-3">
        {[
          ["Chest", "102"],
          ["Waist", "84"],
          ["Arm", "38.5"],
        ].map(([k, v]) => (
          <li key={k} className="rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-foreground/10">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="font-mono text-xs font-semibold text-foreground">
              {v}
              <span className="text-[9px] font-normal text-muted-foreground"> cm</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Cardio: a live ECG trace and a run summary.                                */

const ECG =
  "M0,20 L18,20 L22,20 L26,12 L30,28 L34,20 L52,20 L56,20 L60,4 L64,36 L68,20 L86,20 L90,20 L94,12 L98,28 L102,20 L120,20 L124,20 L128,4 L132,36 L136,20 L160,20";

function CardioTile() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <HeartPulse className="lp-heartbeat size-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Cardio log</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Runs, rides, rows and elliptical, with distance, time, pace and average heart rate.
      </p>

      <div className="mt-4 rounded-xl bg-background/70 p-3 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg heart rate</p>
          <p className="font-mono text-sm font-bold tabular-nums text-foreground">
            152 <span className="text-[10px] font-medium text-rose-500">bpm</span>
          </p>
        </div>
        <svg viewBox="0 0 160 40" className="mt-1 h-10 w-full" preserveAspectRatio="none" aria-hidden>
          <path d={ECG} fill="none" stroke="var(--foreground)" strokeOpacity="0.1" strokeWidth="1.5" strokeLinejoin="round" />
          <path
            d={ECG}
            fill="none"
            stroke="oklch(0.65 0.2 20)"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="lp-ecg"
          />
        </svg>
      </div>

      <ul className="mt-auto grid grid-cols-3 gap-1.5 pt-3">
        {[
          ["Run", "5.2 km"],
          ["Time", "26:40"],
          ["Pace", "5'08\""],
        ].map(([k, v]) => (
          <li key={k} className="rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-foreground/10">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="font-mono text-xs font-semibold text-foreground">{v}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Sync: off by default; flip it and packets start travelling.               */

function SyncTile() {
  const [on, setOn] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Database className="size-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Sync, if you want it</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Point FitFlow at your own Postgres and it merges changes across devices. Off by default.
      </p>

      <div className="mt-4 rounded-xl bg-background/70 p-3 ring-1 ring-foreground/10">
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-foreground ring-1 ring-foreground/10">
            <Smartphone className="size-4" />
          </span>
          <div className="relative h-9 flex-1">
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 border-t border-dashed transition-colors",
                on ? "border-primary/60" : "border-foreground/15"
              )}
            />
            {on &&
              [0, 0.8, 1.6].map((delay) => (
                <span
                  key={delay}
                  aria-hidden
                  className="lp-travel absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_1px] shadow-primary/70"
                  style={{ animationDelay: `-${delay}s` }}
                />
              ))}
          </div>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors",
              on ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-foreground/10"
            )}
          >
            <Database className="size-4" />
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
          {on ? "your-db/fitflow · 3 changes pushed" : "No DATABASE_URL · stays on the phone"}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-sm font-medium text-foreground">{on ? "Sync enabled" : "Sync disabled"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Toggle sync"
          onClick={() => setOn((v) => !v)}
          className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-primary" : "bg-foreground/20")}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow", on ? "left-[22px]" : "left-0.5")}
          />
        </button>
      </div>
    </div>
  );
}
