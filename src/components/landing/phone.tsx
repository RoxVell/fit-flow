"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChartNoAxesColumn, Dumbbell, Flame, House, WifiOff } from "lucide-react";

/*
 * The app, on the thing it actually runs on. A dashboard moment:
 * today's session, the week's volume, and the start button.
 */

const WEEK_VOLUME = [62, 45, 0, 78, 55, 0, 88]; // % heights, rest days empty

export function Phone() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto w-fit">
      {/* ember halo behind the device */}
      <div
        className="absolute -inset-16 -z-10"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgb(255 100 10 / 0.14), transparent 70%)",
        }}
        aria-hidden
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 36, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          className="w-[272px] rounded-[2.6rem] border border-[rgb(242_238_232/0.14)] bg-[#0f0d0b] p-2 shadow-[0_40px_90px_rgb(0_0_0/0.6)]"
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-[#131009]">
            {/* punch-hole camera */}
            <div className="absolute top-2.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-black ring-1 ring-[rgb(255_255_255/0.08)]" />

            {/* status bar */}
            <div className="fl-mono flex items-center justify-between px-5 pt-3 pb-2 text-[0.6rem] tracking-[0.14em] text-[var(--fl-muted)]">
              <span>18:47</span>
              <span className="flex items-center gap-1">
                <WifiOff className="size-3" />
                OFFLINE
              </span>
            </div>

            <div className="px-4 pb-4">
              <p className="fl-mono text-[0.58rem] tracking-[0.2em] text-[var(--fl-ember)]">
                WEEK 5 · PUSH A
              </p>
              <h3 className="mt-1 text-[1.05rem] font-semibold text-[var(--fl-text)]">
                Today&apos;s session
              </h3>

              {/* stat tiles */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--fl-line)] bg-[rgb(255_255_255/0.02)] p-2.5">
                  <div className="fl-mono text-base font-bold text-[var(--fl-text)]">12.4 t</div>
                  <div className="fl-mono mt-0.5 text-[0.55rem] tracking-[0.16em] text-[var(--fl-muted)]">
                    WEEK VOLUME
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--fl-line)] bg-[rgb(255_255_255/0.02)] p-2.5">
                  <div className="fl-mono flex items-center gap-1 text-base font-bold text-[var(--fl-ember)]">
                    3 <Flame className="size-3.5" />
                  </div>
                  <div className="fl-mono mt-0.5 text-[0.55rem] tracking-[0.16em] text-[var(--fl-muted)]">
                    PRS THIS WEEK
                  </div>
                </div>
              </div>

              {/* volume bars */}
              <div className="mt-3 rounded-xl border border-[var(--fl-line)] bg-[rgb(255_255_255/0.02)] p-2.5">
                <div className="flex h-14 items-end gap-1.5">
                  {WEEK_VOLUME.map((v, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        background:
                          v === 0
                            ? "rgb(255 255 255 / 0.06)"
                            : i === WEEK_VOLUME.length - 1
                              ? "linear-gradient(180deg, var(--fl-amber), var(--fl-ember))"
                              : "color-mix(in oklch, var(--fl-ember) 55%, transparent)",
                      }}
                      initial={reduced ? false : { height: "6%" }}
                      animate={{ height: `${Math.max(v, 6)}%` }}
                      transition={{ duration: 0.7, delay: 1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ))}
                </div>
                <div className="fl-mono mt-1.5 flex justify-between text-[0.5rem] tracking-[0.1em] text-[var(--fl-muted)]">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i} className="flex-1 text-center">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* next exercises */}
              <div className="fl-mono mt-3 space-y-1.5 text-[0.62rem] tracking-[0.08em] text-[var(--fl-muted)]">
                <div className="flex justify-between">
                  <span>BENCH PRESS</span>
                  <span className="text-[var(--fl-text)]">5 × 100 KG</span>
                </div>
                <div className="flex justify-between">
                  <span>OVERHEAD PRESS</span>
                  <span className="text-[var(--fl-text)]">5 × 60 KG</span>
                </div>
                <div className="flex justify-between">
                  <span>DIPS</span>
                  <span className="text-[var(--fl-text)]">3 × BW+20</span>
                </div>
              </div>

              {/* start button */}
              <div className="fl-btn mt-3.5 h-10 w-full text-sm">Start workout</div>

              {/* bottom nav */}
              <div className="mt-3 flex items-center justify-around border-t border-[var(--fl-line)] pt-2.5 text-[var(--fl-muted)]">
                <House className="size-4 text-[var(--fl-ember)]" />
                <Dumbbell className="size-4" />
                <ChartNoAxesColumn className="size-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
