"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Barbell } from "./barbell";
import { Phone } from "./phone";

const LINES = ["Every rep.", "Every kilo.", "Counted."];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
        <motion.p
          className="fl-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Offline-first training log
        </motion.p>

        <h1 className="fl-display mt-5 text-[clamp(3.2rem,8.5vw,5.9rem)]">
          {LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className={`block ${i === 2 ? "fl-heat-text" : ""}`}
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1 + i * 0.13,
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--fl-muted)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          FitFlow is a training log for people who run real programs. Build the
          plan, log sets as you lift, and watch your e1RM climb — even with no
          signal in a basement gym.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/dashboard" className="fl-btn h-12 px-7 text-base">
            Start training
            <ArrowRight className="size-4" />
          </Link>
          <Link href="#log" className="fl-btn-ghost h-12 px-6 text-base">
            See how it works
          </Link>
          <span className="fl-mono w-full text-[0.7rem] tracking-[0.18em] text-[var(--fl-muted)] uppercase sm:w-auto">
            PWA · installs on your phone · free
          </span>
        </motion.div>
        </div>

        <div className="hidden lg:block">
          <Phone />
        </div>

        <div className="fl-bar-wrap mt-4 w-full lg:col-span-2 lg:mt-14">
          <Barbell />
        </div>
      </div>
    </section>
  );
}
