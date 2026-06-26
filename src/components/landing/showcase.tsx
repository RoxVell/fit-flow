import type { ComponentType, ReactNode } from "react";
import { Timer, LineChart, Trophy } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";
import { Reveal } from "./reveal";

type ShowcaseRow = {
  eyebrow: string;
  icon: ComponentType<LucideProps>;
  title: string;
  body: string;
  mockup: ReactNode;
  reverse?: boolean;
};

const rows: ShowcaseRow[] = [
  {
    eyebrow: "During the workout",
    icon: Timer,
    title: "A focused logging flow that stays out of your way",
    body: "Active exercises get a glowing accent so you never lose your place. Set rows auto-fill from last time, a rest timer floats above the nav, and finishing your session lands on a triumph screen with your new PRs.",
    mockup: <WorkoutMockup />,
  },
  {
    eyebrow: "After the workout",
    icon: LineChart,
    title: "See your strength climb, week over week",
    body: "FitFlow turns every logged set into a progress index — per exercise, per body part, and overall. Switch between e1RM and volume, pick a window, and watch the trend line prove the work is paying off.",
    mockup: <ProgressMockup />,
    reverse: true,
  },
];

export function Showcase() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="space-y-24">
          {rows.map(({ eyebrow, icon: Icon, title, body, mockup, reverse }) => (
            <div
              key={title}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <Reveal className={reverse ? "lg:order-2" : undefined}>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Icon className="size-4" />
                  {eyebrow}
                </div>
                <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Reveal>
              <Reveal delay={0.1} className={reverse ? "lg:order-1" : undefined}>
                {mockup}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkoutMockup() {
  return (
    <PhoneMockup>
      <div className="flex h-full flex-col gap-2.5 overflow-hidden px-3 pb-3 pt-2">
        {/* Sticky timer header */}
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
          <div>
            <p className="font-mono text-base font-bold text-primary">24:18</p>
            <p className="text-[10px] text-muted-foreground">3/14 sets · 3,240 kg</p>
          </div>
          <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
            Finish
          </span>
        </div>

        {/* Active exercise card */}
        <div className="relative overflow-hidden rounded-xl bg-card p-3 pl-4 ring-1 ring-primary/40">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary shadow-[0_0_12px_2px] shadow-primary/60" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Bench Press
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] text-secondary-foreground">
              Chest
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <SetRow n={1} prev="80×5" cur="82.5×5" done />
            <SetRow n={2} prev="80×5" cur="82.5×5" done />
            <SetRow n={3} prev="80×5" cur="82.5×5" />
          </div>
        </div>

        {/* Idle exercise card */}
        <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <span className="text-sm font-semibold text-foreground">
            Incline DB Press
          </span>
          <div className="mt-2 space-y-1">
            <SetRow n={1} prev="30×8" cur="— × —" />
          </div>
        </div>

        {/* Rest timer */}
        <div className="mt-auto flex items-center justify-between rounded-xl bg-background px-3 py-2 ring-1 ring-foreground/10">
          <span className="text-[10px] text-muted-foreground">Rest timer</span>
          <span className="font-mono text-sm font-bold text-primary">01:23</span>
        </div>
      </div>
    </PhoneMockup>
  );
}

function SetRow({
  n,
  prev,
  cur,
  done,
}: {
  n: number;
  prev: string;
  cur: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-3 text-muted-foreground">{n}</span>
      <span className="flex-1 text-muted-foreground/60">{prev}</span>
      <span className={`font-mono ${done ? "text-foreground" : "text-muted-foreground/40"}`}>
        {cur}
      </span>
      <span
        className={`flex size-3.5 items-center justify-center rounded-[4px] border ${
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-foreground/20"
        }`}
      >
        {done && <span className="text-[8px]">✓</span>}
      </span>
    </div>
  );
}

function ProgressMockup() {
  return (
    <PhoneMockup>
      <div className="flex h-full flex-col gap-3 overflow-hidden px-4 pb-4 pt-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Overall progress</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-primary">
              118%
            </span>
            <span className="text-xs text-emerald-500">+18% vs baseline</span>
          </div>
        </div>

        {/* Faux line chart */}
        <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <svg viewBox="0 0 240 110" className="h-auto w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,90 L30,82 L60,86 L90,70 L120,64 L150,48 L180,40 L210,30 L240,18 L240,110 L0,110 Z"
              fill="url(#area)"
            />
            <path
              d="M0,90 L30,82 L60,86 L90,70 L120,64 L150,48 L180,40 L210,30 L240,18"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="240" cy="18" r="4" fill="var(--primary)" />
          </svg>
          <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
          </div>
        </div>

        {/* Body part summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Chest", "+22%"],
            ["Back", "+15%"],
            ["Legs", "+11%"],
          ].map(([part, delta]) => (
            <div key={part} className="rounded-lg bg-card p-2 ring-1 ring-foreground/10">
              <p className="text-[9px] text-muted-foreground">{part}</p>
              <p className="font-mono text-xs font-bold text-emerald-500">
                {delta}
              </p>
            </div>
          ))}
        </div>

        {/* PR row */}
        <div className="mt-auto flex items-center gap-3 rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              3 new personal records
            </p>
            <p className="text-[10px] text-muted-foreground">
              Bench, Squat, Deadlift
            </p>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
}
