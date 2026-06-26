"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, Play, ChevronRight } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-28 lg:grid-cols-2 lg:gap-8 lg:pt-32">
        {/* Copy */}
        <div className="relative text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Offline-first strength training
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-[4rem] lg:leading-[1.05]">
              Train smarter.
              <br />
              <span className="text-primary">Track every gain.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0">
              FitFlow is an intelligent workout companion for strength
              training — build programs, log sets in real time, and watch your
              progress climb. All on your phone, even offline.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/dashboard"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:translate-y-px sm:w-auto"
              >
                <Dumbbell className="size-5" />
                Open FitFlow
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-xl border border-border bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
              >
                See features
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Phone mockup */}
        <Reveal delay={0.2} className="relative">
          <HeroPhone />
        </Reveal>
      </div>
    </section>
  );
}

/** A faux dashboard rendered inside the phone frame. */
function HeroPhone() {
  return (
    <PhoneMockup>
      <div className="flex h-full flex-col gap-3 overflow-hidden px-4 pb-4 pt-2">
        {/* Greeting */}
        <div>
          <p className="font-mono text-sm text-foreground">
            Ready to crush it, <span className="text-primary">Anton</span>?
          </p>
          <p className="text-xs text-muted-foreground">Tuesday · Push day</p>
        </div>

        {/* 2x2 stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile tint="text-sky-500" label="Steps" value="8,420" />
          <StatTile tint="text-primary" label="Calories" value="612" />
          <StatTile tint="text-emerald-500" label="Weight" value="78.4 kg" />
          <StatTile tint="text-rose-500" label="Active days" value="12" />
        </div>

        {/* Mini PR card */}
        <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <p className="text-xs font-medium text-muted-foreground">
            Recent PR
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Bench Press
            </span>
            <span className="font-mono text-sm text-primary">82.5 kg</span>
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-500">+2.5 kg</div>
        </div>

        {/* Pulsing CTA */}
        <motion.div
          className="relative mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Dumbbell className="size-4" />
          <span className="text-sm font-semibold">Start Workout</span>
          <Play className="size-3" fill="currentColor" />
        </motion.div>
      </div>
    </PhoneMockup>
  );
}

function StatTile({
  tint,
  label,
  value,
}: {
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-card p-2.5 ring-1 ring-foreground/10">
      <div className={`size-6 rounded-md bg-current/15 ${tint}`} />
      <p className="mt-1.5 text-[10px] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
