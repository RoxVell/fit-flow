"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, ChevronDown, Dumbbell, Trophy, WifiOff } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";
import { LiveLogger } from "./live-logger";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();

  // Pointer parallax for the phone: the section tracks the cursor, the phone
  // tilts a few degrees towards it. Springs keep it buttery; touch devices
  // never fire pointermove so they simply get the resting pose.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 });

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative overflow-hidden pt-32 sm:pt-40"
      aria-labelledby="hero-title"
    >
      {/* Ambient aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="lp-aurora absolute left-[10%] top-[-10%] h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]" />
        <div
          className="lp-aurora absolute right-[-5%] top-[20%] h-[420px] w-[420px] rounded-full bg-amber-400/20 blur-[120px]"
          style={{ animationDelay: "-9s", animationDirection: "reverse" }}
        />
        <div className="lp-dots lp-mask-radial absolute inset-0 opacity-70" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        {/* Copy */}
        <div className="relative text-center lg:text-left">
          <h1
            id="hero-title"
            className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4rem]"
          >
            <Words text="Every rep counted." />
            <br />
            <Words
              text="Even with"
              delay={0.25}
            />{" "}
            <Words
              text="zero bars."
              delay={0.4}
              className="lp-serif lp-shimmer whitespace-nowrap pr-2 text-[1.12em]"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:text-xl"
          >
            FitFlow is a strength tracker that installs like an app, asks for no
            account, and keeps every set on your phone. Log in one tap, rest on
            the clock, and watch your lifts climb.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link
              href="/dashboard"
              className="lp-sheen group inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:-translate-y-0.5 active:translate-y-px sm:w-auto"
            >
              <Dumbbell className="size-5" />
              Open FitFlow
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="group inline-flex h-13 w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-background/60 px-6 text-base font-medium text-foreground backdrop-blur transition-colors hover:bg-muted sm:w-auto"
            >
              See how it works
              <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.95 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start"
          >
            {["Works in airplane mode", "824 exercises built in", "Installs from the browser"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" strokeWidth={3} />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Live demo */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
          className="relative mx-auto w-full max-w-[420px] [perspective:1400px]"
        >
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative">
            <PhoneMockup>
              <LiveLogger />
            </PhoneMockup>

            {/* Floating chips */}
            <Chip
              className="lp-float -left-4 top-24 sm:-left-12"
              icon={<WifiOff className="size-3.5" />}
              title="Signal lost"
              sub="14 sets kept on device"
              delay="-1.5s"
              tone="muted"
            />
            <Chip
              className="lp-float -right-2 bottom-40 sm:-right-10"
              icon={<Trophy className="size-3.5" />}
              title="PR detected"
              sub="Bench 82.5 kg"
              delay="-3s"
              tone="primary"
            />
          </motion.div>

          {/* Floor shadow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 -bottom-8 h-16 rounded-[100%] bg-foreground/20 blur-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}

/** Word-by-word clip-mask rise for the headline. */
function Words({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={cn("inline", className)}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "115%", rotate: 4 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.06 }}
          >
            {word}
          </motion.span>
          {i < text.split(" ").length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

function Chip({
  className,
  icon,
  title,
  sub,
  delay,
  tone,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  delay: string;
  tone: "primary" | "muted";
}) {
  return (
    <div
      aria-hidden
      style={{ animationDelay: delay }}
      className={cn(
        "absolute z-10 flex items-center gap-2.5 rounded-2xl border px-3 py-2 shadow-xl backdrop-blur-xl",
        tone === "primary"
          ? "border-primary/30 bg-primary/15 shadow-primary/20"
          : "border-border/70 bg-background/80 shadow-foreground/10",
        className
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg",
          tone === "primary" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
