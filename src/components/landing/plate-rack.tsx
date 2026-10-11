import type { ReactNode } from "react";
import { Reveal } from "./reveal";

/*
 * Bento grid of capabilities. Each cell is still "a plate on the bar" —
 * its accent colour follows the IWF plate it adds, and the totals
 * reconcile with the 175 kg racked in the hero. Artwork runs edge-to-edge
 * through each card like a strip of chart paper, not a floating icon.
 */

const glow = (c: string) => ({
  filter: `drop-shadow(0 0 10px color-mix(in oklch, ${c} 35%, transparent))`,
});

const MONO = "700 13px var(--font-geist-mono), monospace";

function Cell({
  color,
  kg,
  title,
  body,
  art,
  artBottom = false,
  className = "",
  delay = 0,
}: {
  color: string;
  kg: string;
  title: string;
  body: string;
  art: ReactNode;
  /** tall cells: pin the art to the bottom instead of the middle strip */
  artBottom?: boolean;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <article className="fl-card group relative flex h-full flex-col overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent, ${color} 40%, transparent)`,
          }}
          aria-hidden
        />
        <span
          className="fl-mono absolute top-4 right-4 z-10 rounded-md border bg-[rgb(12_10_8/0.5)] px-2 py-1 text-[0.65rem] font-bold tracking-[0.12em] backdrop-blur-sm"
          style={{
            color,
            borderColor: `color-mix(in oklch, ${color} 45%, transparent)`,
          }}
        >
          +2×{kg} KG
        </span>

        {artBottom ? (
          <>
            <div className="relative z-10 px-6 pt-6">
              <h3 className="max-w-[70%] text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--fl-muted)]">{body}</p>
            </div>
            <div className="pointer-events-none mt-auto min-h-40" aria-hidden>
              {art}
            </div>
          </>
        ) : (
          <>
            <div
              className="flex flex-1 items-center pt-14 pb-3 transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
              aria-hidden
            >
              {art}
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--fl-muted)]">{body}</p>
            </div>
          </>
        )}
      </article>
    </Reveal>
  );
}

/* --- per-plate artwork: full-width strips ----------------------------- */

function OfflineArt({ c }: { c: string }) {
  // no signal → the set lands anyway
  return (
    <svg viewBox="0 0 400 90" className="w-full" style={glow(c)} aria-hidden>
      <g stroke={c} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M28 44 Q62 14 96 44" opacity="0.4" />
        <path d="M42 56 Q62 38 82 56" opacity="0.4" />
        <line x1="34" y1="22" x2="90" y2="70" />
      </g>
      <circle cx="62" cy="68" r="4" fill={c} />
      <g stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
        <line x1="128" y1="45" x2="222" y2="45" strokeDasharray="2 9" />
        <path d="M216 38 L228 45 L216 52" fill="none" />
      </g>
      <rect x="252" y="26" width="122" height="38" rx="10" fill="none" stroke={c} strokeWidth="2.5" />
      <text x="313" y="50" textAnchor="middle" fill={c} style={{ font: MONO }}>
        SET SAVED ✓
      </text>
    </svg>
  );
}

function AnalyticsArt({ c }: { c: string }) {
  // fills the bottom of the tall cell, area fading into the card
  return (
    <svg
      viewBox="0 0 300 190"
      preserveAspectRatio="none"
      className="block h-44 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="fl-rack-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 90, 140].map((y) => (
        <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="var(--fl-line)" strokeDasharray="3 6" />
      ))}
      <path
        d="M0 172 L44 150 L88 156 L132 112 L176 122 L220 66 L264 74 L300 30 L300 190 L0 190 Z"
        fill="url(#fl-rack-area)"
      />
      <path
        d="M0 172 L44 150 L88 156 L132 112 L176 122 L220 66 L264 74 L300 30"
        fill="none"
        stroke={c}
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={glow(c)}
      />
    </svg>
  );
}

function ProgramArt({ c }: { c: string }) {
  // a week strip: training days carry their sets × reps
  const days = [
    { label: "5×5", on: true },
    { label: "", on: false },
    { label: "4×8", on: true },
    { label: "", on: false },
    { label: "3×3", on: true },
    { label: "5×5", on: true },
    { label: "", on: false },
  ];
  return (
    <svg viewBox="0 0 400 90" className="w-full" style={glow(c)} aria-hidden>
      {days.map((d, i) => {
        const x = 14 + i * 54;
        return (
          <g key={i}>
            <rect
              x={x}
              y={22}
              width={46}
              height={46}
              rx={10}
              fill={d.on ? c : "none"}
              fillOpacity={d.on ? 0.92 : 0}
              stroke={c}
              strokeWidth="2.5"
              strokeOpacity={d.on ? 1 : 0.35}
            />
            {d.on && (
              <text
                x={x + 23}
                y={51}
                textAnchor="middle"
                fill="#17100a"
                style={{ font: MONO }}
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PrArt({ c }: { c: string }) {
  // attempts climbing across the card, flag on the last
  const bars = [22, 30, 38, 48, 62];
  return (
    <svg viewBox="0 0 400 90" className="w-full" style={glow(c)} aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={26 + i * 62}
          y={84 - h}
          width={34}
          height={h}
          rx={6}
          fill={c}
          opacity={0.35 + (i / (bars.length - 1)) * 0.65}
        />
      ))}
      <line x1={291} y1={22} x2={291} y2={6} stroke={c} strokeWidth="3" strokeLinecap="round" />
      <text x={304} y={16} fill={c} style={{ font: MONO }}>
        PR!
      </text>
    </svg>
  );
}

function CardioArt({ c }: { c: string }) {
  // heart-rate trace, edge to edge
  return (
    <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="w-full" aria-hidden>
      <path
        d="M0 45 L96 45 L118 18 L146 76 L168 45 L252 45 L272 30 L290 58 L306 45 L400 45"
        fill="none"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={glow(c)}
      />
    </svg>
  );
}

function DeloadArt({ c }: { c: string }) {
  // the planned valley: dashed while backed off, solid on the climb back
  return (
    <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="w-full" aria-hidden>
      <g style={glow(c)}>
        <path d="M0 34 L128 28" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <path
          d="M128 28 C168 28 168 66 200 66 C232 66 232 30 272 26"
          fill="none"
          stroke={c}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 8"
        />
        <path d="M272 26 L400 14" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x={200} y={86} textAnchor="middle" fill={c} opacity="0.8" style={{ font: MONO }}>
        WK 7
      </text>
    </svg>
  );
}

/* --- the grid --------------------------------------------------------- */

export function PlateRack() {
  return (
    <section id="rack" className="fl-section px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="fl-eyebrow">The rack</p>
          <h2 className="fl-display mt-4 text-[clamp(2.4rem,5.5vw,4rem)]">
            Six plates.
            <br />
            Fully loaded.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Cell
            color="var(--fl-plate-20)"
            kg="20"
            title="Offline-first"
            body="Your phone is the source of truth, not a server. Airplane mode in a concrete basement? Every set still lands the instant you tap it — sync catches up whenever signal returns."
            art={<OfflineArt c="var(--fl-plate-20)" />}
            className="sm:col-span-2"
          />
          <Cell
            color="var(--fl-plate-15)"
            kg="15"
            title="Progress analytics"
            body="e1RM curves, weekly tonnage, muscle-group split — computed from what you actually lifted."
            art={<AnalyticsArt c="var(--fl-plate-15)" />}
            artBottom
            className="sm:row-span-2"
            delay={0.08}
          />
          <Cell
            color="var(--fl-plate-25)"
            kg="25"
            title="Program builder"
            body="Blocks, days, target sets × reps, +2.5 kg progression steps."
            art={<ProgramArt c="var(--fl-plate-25)" />}
            delay={0.05}
          />
          <Cell
            color="var(--fl-plate-10)"
            kg="10"
            title="PR detection"
            body="Best weight, reps, and estimated max — flagged the moment a set beats your history."
            art={<PrArt c="var(--fl-plate-10)" />}
            delay={0.1}
          />
          <Cell
            color="var(--fl-plate-5)"
            kg="5"
            title="Cardio too"
            body="Runs, rows, and bike sessions on the same timeline as your lifting."
            art={<CardioArt c="var(--fl-plate-5)" />}
            delay={0.08}
          />
          <Cell
            color="#a9a29a"
            kg="2.5"
            title="Honest deloads"
            body="Mark a week as deload and it's excluded from progression stats — a planned easy week never reads as a plateau."
            art={<DeloadArt c="#a9a29a" />}
            className="sm:col-span-2"
            delay={0.12}
          />
        </div>

        <Reveal delay={0.1}>
          <p className="fl-mono mt-10 text-center text-[0.72rem] tracking-[0.18em] text-[var(--fl-muted)]">
            20 KG BAR + 2 × 77.5 KG = 175 KG — THE NUMBER YOU SAW UP TOP.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
