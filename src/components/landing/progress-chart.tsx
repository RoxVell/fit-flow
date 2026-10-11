"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";

/*
 * Twelve weeks of squat e1RM, drawn like the app's analytics screen.
 * The dip at week 7 is a deload — annotated and excluded, same as the
 * app treats it in stats.
 */

const DATA = [100, 102.5, 105, 105, 107.5, 110, 104, 112.5, 115, 117.5, 120, 122.5];
const DELOAD_INDEX = 6;

const W = 560;
const H = 280;
const X0 = 34;
const X1 = 546;
const Y_TOP = 26;
const Y_BOTTOM = 234;
const V_MIN = 98;
const V_MAX = 126;

const x = (i: number) => X0 + (i * (X1 - X0)) / (DATA.length - 1);
const y = (v: number) => Y_BOTTOM - ((v - V_MIN) / (V_MAX - V_MIN)) * (Y_BOTTOM - Y_TOP);

const linePath = DATA.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
const areaPath = `${linePath} L ${x(DATA.length - 1)} ${Y_BOTTOM} L ${X0} ${Y_BOTTOM} Z`;

const STATS = [
  { value: "+22.5 KG", label: "e1RM in 12 weeks" },
  { value: "5", label: "PRs on the way" },
  { value: "1", label: "deload — excluded" },
];

export function ProgressChart() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section id="progress" className="fl-section px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="fl-eyebrow">Over time</p>
          <h2 className="fl-display mt-4 text-[clamp(2.4rem,5.5vw,4rem)]">
            The only chart
            <br />
            that matters
          </h2>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-[var(--fl-muted)]">
            Estimated one-rep max, computed from every logged set. Slow, boring,
            up and to the right — exactly how strength is built.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="fl-card mt-12 overflow-x-auto p-4 sm:p-8">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="min-w-[540px] w-full"
              role="img"
              aria-label="Squat estimated one-rep max rising from 100 to 122.5 kilograms over 12 weeks, with a deload dip at week 7"
            >
              <defs>
                <linearGradient id="fl-heat-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--fl-ember-deep)" />
                  <stop offset="55%" stopColor="var(--fl-ember)" />
                  <stop offset="100%" stopColor="var(--fl-amber)" />
                </linearGradient>
                <linearGradient id="fl-heat-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--fl-ember)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--fl-ember)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* gridlines at 100 / 110 / 120 kg */}
              {[100, 110, 120].map((v) => (
                <g key={v}>
                  <line
                    x1={X0}
                    x2={X1}
                    y1={y(v)}
                    y2={y(v)}
                    stroke="var(--fl-line)"
                    strokeDasharray="3 5"
                  />
                  <text
                    x={X0 - 8}
                    y={y(v) + 3.5}
                    textAnchor="end"
                    fill="var(--fl-muted)"
                    style={{ font: "500 10px var(--font-geist-mono), monospace" }}
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* deload band */}
              <rect
                x={x(DELOAD_INDEX - 0.5)}
                y={Y_TOP}
                width={x(DELOAD_INDEX + 0.5) - x(DELOAD_INDEX - 0.5)}
                height={Y_BOTTOM - Y_TOP}
                fill="rgb(255 255 255 / 0.03)"
              />
              <text
                x={x(DELOAD_INDEX)}
                y={Y_TOP + 12}
                textAnchor="middle"
                fill="var(--fl-muted)"
                style={{ font: "500 9px var(--font-geist-mono), monospace", letterSpacing: "0.1em" }}
              >
                DELOAD
              </text>

              {/* area + line */}
              <motion.path
                d={areaPath}
                fill="url(#fl-heat-fill)"
                initial={reduced ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 1.5 }}
              />
              <motion.path
                d={linePath}
                fill="none"
                stroke="url(#fl-heat-stroke)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />

              {/* data points */}
              {DATA.map((v, i) => (
                <motion.circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={i === DATA.length - 1 ? 5 : 3}
                  fill={i === DELOAD_INDEX ? "var(--fl-muted)" : "var(--fl-ember)"}
                  stroke="var(--fl-bg)"
                  strokeWidth="2"
                  initial={reduced ? false : { opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.3, delay: 0.15 + (i / DATA.length) * 1.7 }}
                />
              ))}

              {/* final PR flag */}
              <motion.g
                initial={reduced ? false : { opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: 1.9 }}
              >
                <rect
                  x={x(11) - 52}
                  y={y(122.5) - 34}
                  width="60"
                  height="20"
                  rx="6"
                  fill="var(--fl-ember)"
                />
                <text
                  x={x(11) - 22}
                  y={y(122.5) - 20.5}
                  textAnchor="middle"
                  fill="#17100a"
                  style={{ font: "700 10px var(--font-geist-mono), monospace" }}
                >
                  122.5 PR
                </text>
              </motion.g>

              {/* week axis */}
              {DATA.map((_, i) =>
                i % 2 === 0 ? (
                  <text
                    key={i}
                    x={x(i)}
                    y={Y_BOTTOM + 22}
                    textAnchor="middle"
                    fill="var(--fl-muted)"
                    style={{ font: "500 9.5px var(--font-geist-mono), monospace" }}
                  >
                    W{i + 1}
                  </text>
                ) : null
              )}
            </svg>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="border-l-2 border-[var(--fl-ember)] pl-5">
                <div className="fl-mono text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="fl-mono mt-1 text-[0.7rem] tracking-[0.18em] text-[var(--fl-muted)] uppercase">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
