"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/*
 * The signature of the page: a competition bar that loads itself.
 * Plates rack pair-by-pair (heaviest first, like in a real gym) while the
 * total ticks up in discrete jumps — 20 kg bar + 2 × 77.5 kg = 175 kg.
 * The same six plates come back as the feature grid further down.
 */

type Plate = {
  kg: number;
  color: string;
  /** height / thickness in em — scaled by .fl-bar-stage */
  h: number;
  t: number;
};

const PLATES: Plate[] = [
  { kg: 25, color: "var(--fl-plate-25)", h: 11.6, t: 2.0 },
  { kg: 20, color: "var(--fl-plate-20)", h: 10.4, t: 1.8 },
  { kg: 15, color: "var(--fl-plate-15)", h: 9.2, t: 1.6 },
  { kg: 10, color: "var(--fl-plate-10)", h: 7.6, t: 1.45 },
  { kg: 5, color: "var(--fl-plate-5)", h: 5.6, t: 1.25 },
  { kg: 2.5, color: "var(--fl-plate-2p5)", h: 4.2, t: 1.1 },
];

const BAR_KG = 20;
const TOTAL_KG = BAR_KG + 2 * PLATES.reduce((s, p) => s + p.kg, 0); // 175
const FIRST_PLATE_DELAY = 0.4;
const PLATE_STAGGER = 0.17;

function PlateDisc({
  plate,
  side,
  index,
  active,
}: {
  plate: Plate;
  side: "l" | "r";
  index: number;
  active: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="fl-plate shrink-0"
      title={`${plate.kg} kg`}
      style={{
        // CSS var consumed by .fl-plate's gradient background
        ["--pc" as string]: plate.color,
        height: `${plate.h}em`,
        width: `${plate.t}em`,
      }}
      initial={reduced ? false : { x: side === "l" ? -110 : 110, opacity: 0 }}
      animate={active ? { x: 0, opacity: 1 } : undefined}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: FIRST_PLATE_DELAY + index * PLATE_STAGGER,
      }}
    />
  );
}

export function Barbell() {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.6 });
  const active = inView || (reduced ?? false);
  const [total, setTotal] = useState(BAR_KG);

  useEffect(() => {
    if (!inView || reduced) return;
    // +2 plates per jump, timed to land with each spring's arrival.
    const timers = PLATES.map((p, i) =>
      setTimeout(
        () => setTotal((t) => Math.round((t + 2 * p.kg) * 10) / 10),
        (FIRST_PLATE_DELAY + 0.22 + i * PLATE_STAGGER) * 1000
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced]);

  const shownTotal = reduced ? TOTAL_KG : total;
  const leftPlates = [...PLATES].reverse(); // outermost first in DOM order
  const rightPlates = PLATES;

  return (
    <div ref={stageRef} className="fl-bar-stage relative mx-auto w-full select-none">
      <div className="fl-bar-glow" aria-hidden />
      <div
        className="relative flex h-[13em] items-center justify-center"
        role="img"
        aria-label={`Loaded barbell, ${TOTAL_KG} kg total`}
      >
        <div className="relative flex items-center gap-[0.22em]">
          {/* rod hugs the plate assembly with a short sleeve overhang */}
          <div className="fl-bar-rod" aria-hidden />
          <div className="fl-bar-knurl" aria-hidden />

          {leftPlates.map((p, i) => (
            <PlateDisc
              key={`l${p.kg}`}
              plate={p}
              side="l"
              index={leftPlates.length - 1 - i}
              active={active}
            />
          ))}
          <div className="fl-collar shrink-0" aria-hidden />
          <div className="w-[19em] shrink-0 sm:w-[26em]" aria-hidden />
          <div className="fl-collar shrink-0" aria-hidden />
          {rightPlates.map((p, i) => (
            <PlateDisc key={`r${p.kg}`} plate={p} side="r" index={i} active={active} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-center gap-3">
        <motion.span
          key={shownTotal}
          initial={reduced ? false : { scale: 1.16 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="fl-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {shownTotal.toFixed(1)}
        </motion.span>
        <span className="fl-mono text-xs tracking-[0.22em] text-[var(--fl-muted)]">
          KG · LOADED
        </span>
      </div>
    </div>
  );
}
