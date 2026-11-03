import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  Dumbbell,
  LayoutDashboard,
  Library,
  Pause,
  Settings,
  Trophy,
  WifiOff,
} from "lucide-react";
import { interpolate } from "remotion";
import { clamp, entrance, mono, palette as p, progress } from "./theme";

export function Brand({ large = false }: { large?: boolean }) {
  const size = large ? 76 : 48;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: large ? 22 : 15 }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="15" fill={p.orange} />
        <path
          d="M20 20v24M28 15v34M36 15v34M44 20v24"
          stroke={p.text}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: large ? 62 : 34,
          fontWeight: 650,
          letterSpacing: "-0.05em",
        }}
      >
        FitFlow<span style={{ color: p.orange }}>.</span>
      </span>
    </div>
  );
}

export function Reveal({
  frame,
  delay = 0,
  children,
  style,
}: {
  frame: number;
  delay?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = entrance(frame, delay);
  return (
    <div
      style={{
        opacity: progress(frame, delay, delay + 16),
        transform: `translateY(${(1 - t) * 48}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: p.orange,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        fontSize: 20,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 30, height: 2, background: p.orange }} />
      {children}
    </div>
  );
}

export function Phone({
  children,
  style,
  activeTab = 1,
}: {
  children: ReactNode;
  style?: CSSProperties;
  activeTab?: number;
}) {
  return (
    <div
      style={{
        width: 450,
        height: 816,
        padding: 12,
        borderRadius: 58,
        background:
          "linear-gradient(135deg,#66646a,#222125 25%,#3b393f 70%,#77747c)",
        boxShadow: "0 42px 90px #0009, inset 0 0 0 1px #ffffff30",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: 46,
          background: "#0c0c0e",
          overflow: "hidden",
          border: "1px solid #000",
        }}
      >
        <div
          style={{
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
            fontSize: 15,
            fontWeight: 650,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              width: 112,
              height: 25,
              background: "#000",
              borderRadius: 20,
            }}
          />
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>▮▮▮</span>
            <span
              style={{
                height: 10,
                width: 21,
                background: p.text,
                borderRadius: 3,
              }}
            />
          </span>
        </div>
        {children}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 14,
            right: 14,
            display: "flex",
            justifyContent: "space-around",
            padding: "17px 0 0",
            background: "#0c0c0e",
            borderTop: `1px solid ${p.border}`,
          }}
        >
          {[LayoutDashboard, Dumbbell, Library, BarChart3, Settings].map(
            (Icon, i) => (
              <Icon
                key={i}
                size={23}
                color={i === activeTab ? p.orange : p.muted}
                strokeWidth={1.7}
              />
            ),
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 9,
            left: "36%",
            width: "28%",
            height: 4,
            borderRadius: 4,
            background: "#eeecea",
          }}
        />
      </div>
    </div>
  );
}

export function WorkoutScreen({
  frame = 0,
  compact = false,
}: {
  frame?: number;
  compact?: boolean;
}) {
  const completed = frame >= 47 ? 3 : 2;
  const flash = 1 - progress(frame, 47, 75);
  return (
    <div style={{ padding: compact ? "8px 17px" : "8px 22px", fontSize: 19 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ color: p.muted, fontSize: 14, marginBottom: 5 }}>
            Push day
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 26,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            24:
            {String(18 + Math.floor(Math.max(0, frame) / 30)).padStart(2, "0")}
            <Pause size={16} color={p.muted} />
          </div>
        </div>
        <div
          style={{
            background: p.orange,
            color: "#17100b",
            borderRadius: 10,
            padding: "10px 15px",
            fontWeight: 650,
            fontSize: 16,
          }}
        >
          Finish
        </div>
      </div>
      <div
        style={{
          border: `1px solid ${p.orange}55`,
          borderRadius: 22,
          padding: "22px 16px",
          background: "linear-gradient(145deg,#211910,#141416 65%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 26,
          }}
        >
          <span style={{ fontWeight: 650, fontSize: 23 }}>Bench Press</span>
          <span
            style={{
              color: p.muted,
              background: p.raised,
              padding: "5px 9px",
              fontSize: 12,
              borderRadius: 10,
            }}
          >
            Chest
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "25px 1fr 64px 48px 36px",
            gap: 6,
            color: p.muted,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          <span>Set</span>
          <span>Previous</span>
          <span>kg</span>
          <span>Reps</span>
          <span />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "25px 1fr 64px 48px 36px",
              gap: 6,
              alignItems: "center",
              height: 56,
              borderBottom: `1px solid ${p.border}66`,
              background:
                i === 2 && frame >= 47
                  ? `rgba(105,223,170,${flash * 0.15})`
                  : "transparent",
            }}
          >
            <span style={{ color: p.muted, fontSize: 15 }}>{i + 1}</span>
            <span style={{ color: p.muted, fontFamily: mono, fontSize: 14 }}>
              80 × 5
            </span>
            <span
              style={{
                padding: "7px 0",
                background: p.raised,
                borderRadius: 9,
                textAlign: "center",
                fontFamily: mono,
                fontSize: 19,
              }}
            >
              82.5
            </span>
            <span
              style={{
                padding: "7px 0",
                background: p.raised,
                borderRadius: 9,
                textAlign: "center",
                fontFamily: mono,
                fontSize: 19,
              }}
            >
              5
            </span>
            <span
              style={{
                border: `1px solid ${i < completed ? p.green : p.border}`,
                height: 31,
                width: 31,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: i < completed ? p.green : "#45444a",
                background: i < completed ? "#69dfaa12" : "transparent",
              }}
            >
              <Check size={19} />
            </span>
          </div>
        ))}
        <div
          style={{
            paddingTop: 16,
            color: p.muted,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          + Add set
        </div>
      </div>
      <div
        style={{
          marginTop: 17,
          padding: "18px 20px",
          borderRadius: 20,
          background: p.surface,
          border: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 550 }}>Incline Dumbbell Press</span>
        <ChevronRight color={p.muted} size={19} />
      </div>
      <div
        style={{
          marginTop: 12,
          padding: "14px 16px",
          borderRadius: 18,
          background: "#1e1712",
          border: `1px solid ${p.orange}66`,
          display: "flex",
          alignItems: "center",
          gap: 15,
          opacity: progress(frame, 48, 63),
          transform: `translateY(${(1 - entrance(frame, 48)) * 20}px)`,
        }}
      >
        <div
          style={{
            height: 50,
            width: 50,
            borderRadius: "50%",
            border: `3px solid ${p.orange}`,
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontFamily: mono,
          }}
        >
          1:
          {String(
            30 - Math.min(29, Math.floor(Math.max(0, frame - 47) / 30)),
          ).padStart(2, "0")}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Rest timer</div>
          <div style={{ color: p.muted, fontSize: 13, marginTop: 3 }}>
            Breathe. We&apos;ve got the clock.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressChart({
  frame,
  small = false,
}: {
  frame: number;
  small?: boolean;
}) {
  const t = progress(frame, 20, 112);
  const path =
    "M 28 224 C 72 224 70 196 116 196 S 167 212 204 170 S 265 182 298 133 S 357 148 391 100 S 453 109 490 58 S 546 68 578 26";
  return (
    <div
      style={{
        padding: small ? 22 : 38,
        background: "linear-gradient(150deg,#211a15,#121214 65%)",
        border: `1px solid ${p.border}`,
        borderRadius: small ? 24 : 30,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: small ? 16 : 22,
              color: p.muted,
              marginBottom: 8,
            }}
          >
            Bench Press · estimated 1RM
          </div>
          <div
            style={{
              fontSize: small ? 44 : 68,
              fontWeight: 550,
              fontFamily: mono,
              letterSpacing: "-0.06em",
            }}
          >
            {(70 + 26.3 * t).toFixed(1)}
            <span
              style={{
                fontSize: small ? 18 : 25,
                color: p.muted,
                marginLeft: 12,
              }}
            >
              kg
            </span>
          </div>
        </div>
        <span
          style={{
            color: p.green,
            background: "#69dfaa12",
            border: "1px solid #69dfaa33",
            borderRadius: 30,
            padding: "9px 13px",
            fontSize: small ? 14 : 20,
            display: "flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <ArrowUpRight size={20} />
          26.3 kg
        </span>
      </div>
      <svg viewBox="0 0 610 268" style={{ width: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient
            id={small ? "chart-fill-small" : "chart-fill"}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={p.orange} stopOpacity="0.24" />
            <stop offset="100%" stopColor={p.orange} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 108, 176, 244].map((y) => (
          <line
            key={y}
            x1="0"
            x2="610"
            y1={y}
            y2={y}
            stroke="#ffffff12"
            strokeDasharray="4 8"
          />
        ))}
        <path
          d={`${path} L 578 253 L 28 253 Z`}
          fill={`url(#${small ? "chart-fill-small" : "chart-fill"})`}
          opacity={t}
        />
        <path
          d={path}
          fill="none"
          stroke={p.orange}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - t}
        />
        <circle
          cx="578"
          cy="26"
          r="10"
          fill={p.orange}
          opacity={progress(frame, 95, 112)}
        />
        <circle
          cx="578"
          cy="26"
          r="20"
          fill="none"
          stroke={p.orange}
          opacity={progress(frame, 95, 112) * 0.35}
        />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: p.muted,
          fontFamily: mono,
          fontSize: small ? 11 : 16,
        }}
      >
        <span>WEEK 01</span>
        <span>WEEK 04</span>
        <span>WEEK 08</span>
      </div>
    </div>
  );
}

export function ProgressScreen({ frame }: { frame: number }) {
  return (
    <div style={{ padding: "12px 19px" }}>
      <div style={{ fontSize: 31, fontWeight: 650, marginBottom: 22 }}>
        Your progress<span style={{ color: p.orange }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 18,
          fontSize: 15,
          color: p.muted,
          marginBottom: 25,
        }}
      >
        <span>General</span>
        <span style={{ color: p.orange }}>Exercises</span>
        <span>Body</span>
      </div>
      <ProgressChart frame={frame} small />
      <div
        style={{
          padding: 20,
          borderRadius: 20,
          marginTop: 20,
          background: p.surface,
          border: `1px solid ${p.border}`,
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        <Trophy size={31} color={p.orange} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Personal record</div>
          <div style={{ fontSize: 14, color: p.muted, marginTop: 7 }}>
            A little stronger than last time.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgramsScreen() {
  return (
    <div style={{ padding: "12px 22px" }}>
      <div style={{ fontSize: 31, fontWeight: 650 }}>
        Your training<span style={{ color: p.orange }}>.</span>
      </div>
      <p style={{ color: p.muted, fontSize: 17, margin: "14px 0 28px" }}>
        A plan for every session.
      </p>
      {["Push / Pull / Legs", "Upper / Lower"].map((name, i) => (
        <div
          key={name}
          style={{
            padding: 23,
            background: p.surface,
            border: `1px solid ${i === 0 ? p.orange + "77" : p.border}`,
            borderRadius: 22,
            marginBottom: 15,
          }}
        >
          <Dumbbell size={28} color={p.orange} />
          <div style={{ fontSize: 23, fontWeight: 600, marginTop: 22 }}>
            {name}
          </div>
          <div style={{ color: p.muted, fontSize: 15, marginTop: 8 }}>
            {i === 0 ? "6 training days · Active" : "4 training days"}
          </div>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          marginTop: 26,
          color: p.orange,
        }}
      >
        <Library size={26} />
        <span style={{ fontSize: 22, fontWeight: 600 }}>
          824 exercises built in
        </span>
      </div>
    </div>
  );
}

export function SavedCard({
  frame,
  style,
}: {
  frame: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "25px 30px",
        background: "#171719",
        border: "1px solid #69dfaa55",
        borderRadius: 24,
        boxShadow: "0 20px 60px #0006",
        transform: `translateY(${(1 - entrance(frame, 20)) * 35}px)`,
        opacity: progress(frame, 20, 35),
        ...style,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 54,
          height: 54,
          borderRadius: 17,
          background: "#69dfaa15",
          color: p.green,
        }}
      >
        <Check size={30} />
      </span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 26 }}>
          Set saved on your device
        </div>
        <div style={{ color: p.muted, fontSize: 18, marginTop: 5 }}>
          82.5 kg × 5 reps
        </div>
      </div>
      <WifiOff size={23} color={p.muted} style={{ marginLeft: 22 }} />
    </div>
  );
}

export function Tap({
  frame,
  at = 47,
  x,
  y,
}: {
  frame: number;
  at?: number;
  x: number;
  y: number;
}) {
  const t = interpolate(frame, [at - 6, at + 20], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 28,
        top: y - 28,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#ffffff30",
        border: "2px solid #fff",
        opacity: frame < at - 6 ? 0 : (1 - t) * 0.9,
        transform: `scale(${0.6 + t * 1.5})`,
      }}
    />
  );
}
