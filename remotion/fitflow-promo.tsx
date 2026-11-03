import { loadFont } from "@remotion/fonts";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Dumbbell,
  ShieldCheck,
  Trophy,
  WifiOff,
} from "lucide-react";
import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { ReactNode } from "react";
import {
  Brand,
  Eyebrow,
  Phone,
  ProgramsScreen,
  ProgressChart,
  ProgressScreen,
  Reveal,
  SavedCard,
  Tap,
  WorkoutScreen,
} from "./ui";
import { clamp, entrance, mono, palette as p, progress, type } from "./theme";

loadFont({
  family: "Geist",
  url: staticFile("fonts/geist-latin.woff2"),
  weight: "100 900",
});
loadFont({
  family: "Geist Mono",
  url: staticFile("fonts/geist-mono-latin.woff2"),
  weight: "100 900",
});

const chapters = [
  "Every rep",
  "Find your flow",
  "See your progress",
  "Stay focused",
  "Start today",
];
const cuts = [0, 120, 330, 510, 690, 900];

function Headline({
  children,
  size = type.heading,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <div
      style={{
        fontSize: size,
        lineHeight: 1.04,
        fontWeight: 620,
        letterSpacing: "-0.065em",
      }}
    >
      {children}
    </div>
  );
}

function Backdrop() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: p.background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 77% 46%,#72381833 0%,#25140f18 38%,transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(#ffffff12 1px,transparent 1px),linear-gradient(90deg,#ffffff12 1px,transparent 1px)",
          backgroundSize: "100px 100px",
          transform: `translateY(${frame * 0.025}px)`,
        }}
      />
      {[740, 1060, 1370].map((size, i) => (
        <div
          key={size}
          style={{
            position: "absolute",
            width: size,
            height: size,
            left: 1400 - size / 2,
            top: 530 - size / 2,
            borderRadius: "50%",
            border: `1px solid ${i === 0 ? "#ff7a2429" : "#ffffff0c"}`,
            transform: `scale(${1 + Math.sin(frame / 100 + i) * 0.025})`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg,#09090b88,transparent 45%,#09090b22)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

function Chrome() {
  const frame = useCurrentFrame();
  const active = Math.min(
    4,
    cuts.findIndex((cut, i) => frame >= cut && frame < cuts[i + 1]),
  );
  return (
    <>
      <div style={{ position: "absolute", top: 58, left: 82 }}>
        <Brand />
      </div>
      <div
        style={{
          position: "absolute",
          top: 76,
          right: 82,
          color: p.muted,
          fontFamily: mono,
          fontSize: 15,
          letterSpacing: "0.16em",
        }}
      >
        YOUR STRENGTH. YOUR STORY.
      </div>
      <div
        style={{
          position: "absolute",
          left: 82,
          right: 82,
          bottom: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <span style={{ color: p.orange, fontFamily: mono, fontSize: 17 }}>
            0{active + 1}
          </span>
          <span style={{ color: p.muted, fontSize: 17 }}>
            {chapters[active]}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 55,
                height: 3,
                background: "#ffffff1a",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: p.orange,
                  width: `${interpolate(frame, [cuts[i], cuts[i + 1]], [0, 100], clamp)}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Opening() {
  const frame = useCurrentFrame();
  const phone = entrance(frame, 7);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 102, top: 270, width: 1060 }}>
        <Reveal frame={frame} delay={1}>
          <Eyebrow>Meet your next training partner</Eyebrow>
        </Reveal>
        <Reveal frame={frame} delay={8} style={{ marginTop: 30 }}>
          <Headline size={type.display}>
            You bring
            <br />
            the effort<span style={{ color: p.orange }}>.</span>
          </Headline>
        </Reveal>
        <Reveal
          frame={frame}
          delay={21}
          style={{
            marginTop: 34,
            color: p.orange,
            fontSize: 44,
            letterSpacing: "-0.04em",
            fontWeight: 500,
          }}
        >
          Make every rep count.
        </Reveal>
        <Reveal
          frame={frame}
          delay={31}
          style={{
            marginTop: 38,
            color: p.muted,
            fontSize: type.body,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Dumbbell size={25} />
          The strength tracker that keeps up.
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1240,
          top: 147,
          transform: `perspective(1600px) translateY(${(1 - phone) * 100}px) rotateY(${-13 + progress(frame, 0, 120) * 5}deg) rotateZ(4deg) scale(0.96)`,
          opacity: progress(frame, 7, 27),
        }}
      >
        <Phone>
          <WorkoutScreen frame={70 + frame} />
        </Phone>
      </div>
      <Reveal
        frame={frame}
        delay={39}
        style={{ position: "absolute", left: 1115, top: 782 }}
      >
        <div
          style={{
            padding: "20px 27px",
            background: "#19191cf2",
            border: `1px solid ${p.orange}70`,
            borderRadius: 21,
            display: "flex",
            alignItems: "center",
            gap: 17,
            boxShadow: "0 16px 45px #0007",
          }}
        >
          <Trophy size={29} color={p.orange} />
          <div>
            <div style={{ fontSize: 23, fontWeight: 600 }}>
              One more rep. One step forward.
            </div>
            <div style={{ fontSize: 16, color: p.muted, marginTop: 5 }}>
              Your work deserves a record.
            </div>
          </div>
        </div>
      </Reveal>
    </AbsoluteFill>
  );
}

function Logging() {
  const frame = useCurrentFrame();
  const rest = Math.max(85, 90 - Math.floor(Math.max(0, frame - 47) / 30));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 242, left: 102, width: 880 }}>
        <Reveal frame={frame}>
          <Eyebrow>Built for the space between sets</Eyebrow>
        </Reveal>
        <Reveal frame={frame} delay={6} style={{ marginTop: 32 }}>
          <Headline>
            Less tapping.
            <br />
            <span style={{ color: p.orange }}>More lifting.</span>
          </Headline>
        </Reveal>
        <Reveal
          frame={frame}
          delay={18}
          style={{
            marginTop: 35,
            fontSize: type.body,
            lineHeight: 1.5,
            color: p.muted,
          }}
        >
          Last session&apos;s numbers, already there.
          <br />
          Log your next set with a tap.
        </Reveal>
        <Reveal frame={frame} delay={62} style={{ marginTop: 46 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 25 }}>
            <div style={{ position: "relative", width: 104, height: 104 }}>
              <svg viewBox="0 0 104 104" width="104" height="104">
                <circle
                  cx="52"
                  cy="52"
                  r="47"
                  fill="none"
                  stroke="#ffffff15"
                  strokeWidth="3"
                />
                <circle
                  cx="52"
                  cy="52"
                  r="47"
                  fill="none"
                  stroke={p.orange}
                  strokeWidth="3"
                  strokeDasharray={296}
                  strokeDashoffset={296 * (1 - rest / 90)}
                  transform="rotate(-90 52 52)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 28,
                  fontFamily: mono,
                }}
              >
                1:{String(rest - 60).padStart(2, "0")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 27, fontWeight: 550 }}>
                Rest starts automatically.
              </div>
              <div style={{ marginTop: 8, fontSize: 22, color: p.muted }}>
                Stay in your rhythm.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1190,
          top: 132,
          transform: `translateY(${(1 - entrance(frame)) * 55}px) rotate(${interpolate(frame, [0, 210], [2, -1], clamp)}deg)`,
          opacity: progress(frame, 0, 12),
        }}
      >
        <Phone>
          <WorkoutScreen frame={frame} />
        </Phone>
        <Tap frame={frame} x={372} y={397} />
      </div>
      <Reveal
        frame={frame}
        delay={100}
        style={{ position: "absolute", top: 825, left: 1060 }}
      >
        <div
          style={{
            background: p.text,
            color: "#141414",
            borderRadius: 17,
            padding: "19px 25px",
            display: "flex",
            gap: 13,
            alignItems: "center",
            fontSize: 21,
            fontWeight: 600,
            boxShadow: "0 15px 45px #0007",
          }}
        >
          <CircleCheck size={25} color="#248456" />
          Saved. Back to your workout.
        </div>
      </Reveal>
    </AbsoluteFill>
  );
}

function Progress() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 102, top: 269, width: 830 }}>
        <Reveal frame={frame}>
          <Eyebrow>Small wins. A bigger picture.</Eyebrow>
        </Reveal>
        <Reveal frame={frame} delay={7} style={{ marginTop: 32 }}>
          <Headline>
            Turn effort
            <br />
            into <span style={{ color: p.orange }}>evidence.</span>
          </Headline>
        </Reveal>
        <Reveal
          frame={frame}
          delay={20}
          style={{
            fontSize: type.body,
            lineHeight: 1.5,
            marginTop: 35,
            color: p.muted,
          }}
        >
          See your lifts climb.
          <br />
          Celebrate the records you earn.
        </Reveal>
        <Reveal
          frame={frame}
          delay={83}
          style={{
            marginTop: 45,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              background: "#ff7a241c",
              borderRadius: 14,
            }}
          >
            <BarIcon />
          </span>
          History. Progress. Personal records.
        </Reveal>
      </div>
      <Reveal
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          left: 1040,
          top: 236,
          width: 750,
          transform: `perspective(1800px) rotateY(${-6 + progress(frame, 0, 180) * 6}deg) translateY(${(1 - entrance(frame, 10)) * 60}px)`,
        }}
      >
        <ProgressChart frame={frame} />
      </Reveal>
      <Reveal
        frame={frame}
        delay={100}
        style={{ position: "absolute", left: 1195, top: 755 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 19,
            background: "#1d1915",
            border: `1px solid ${p.orange}66`,
            padding: "23px 31px",
            borderRadius: 22,
            boxShadow: "0 20px 50px #0006",
          }}
        >
          <Trophy size={35} color={p.orange} />
          <div>
            <div
              style={{
                color: p.orange,
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              New personal record
            </div>
            <div style={{ fontSize: 28, fontWeight: 550 }}>
              Bench Press{" "}
              <span style={{ fontFamily: mono, marginLeft: 14 }}>82.5 kg</span>
            </div>
          </div>
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 1070,
          top: 901,
          color: p.muted,
          fontSize: 16,
        }}
      >
        Illustrative training data. Your progress is your own.
      </div>
    </AbsoluteFill>
  );
}

function BarIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 23 23"
      fill="none"
      stroke={p.orange}
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M5 18v-5M11.5 18V9M18 18V4" />
    </svg>
  );
}

function Offline() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 130,
          fontSize: 700,
          lineHeight: 1,
          letterSpacing: "-0.1em",
          fontWeight: 500,
          color: "#ffffff04",
          WebkitTextStroke: "1px #ff7a2444",
          transform: `translateY(${(1 - entrance(frame)) * 70}px)`,
        }}
      >
        0
      </div>
      <div style={{ position: "absolute", left: 102, top: 239, width: 1040 }}>
        <Reveal frame={frame}>
          <Eyebrow>Built for real gyms</Eyebrow>
        </Reveal>
        <Reveal frame={frame} delay={7} style={{ marginTop: 34 }}>
          <Headline size={118}>
            Zero signal.
            <br />
            <span style={{ color: p.orange }}>Full focus.</span>
          </Headline>
        </Reveal>
        <Reveal
          frame={frame}
          delay={23}
          style={{
            marginTop: 35,
            fontSize: type.body,
            color: p.muted,
            lineHeight: 1.5,
          }}
        >
          Your workout keeps going.
          <br />
          Every set stays on your device.
        </Reveal>
        <Reveal
          frame={frame}
          delay={60}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 44,
            color: p.text,
            fontSize: 23,
          }}
        >
          <ShieldCheck size={28} color={p.green} />
          No account. No interruptions.
        </Reveal>
      </div>
      <Reveal
        frame={frame}
        delay={12}
        style={{ position: "absolute", left: 1300, top: 288 }}
      >
        <div
          style={{
            height: 190,
            width: 190,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "#181512",
            border: `1px solid ${p.orange}66`,
            boxShadow: "0 0 100px #ff7a2412",
          }}
        >
          <WifiOff size={77} strokeWidth={1.25} color={p.orange} />
        </div>
      </Reveal>
      <SavedCard
        frame={frame}
        style={{ position: "absolute", left: 1120, top: 575 }}
      />
      <Reveal
        frame={frame}
        delay={43}
        style={{
          position: "absolute",
          left: 1220,
          top: 709,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: p.muted,
          fontFamily: mono,
          fontSize: 17,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            background: p.green,
            borderRadius: "50%",
          }}
        />
        OFFLINE. STILL IN YOUR FLOW.
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 102,
          top: 901,
          fontSize: 16,
          color: p.muted,
        }}
      >
        Open once online. Train offline after the app loads.
      </div>
    </AbsoluteFill>
  );
}

function Closing() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 102,
          top: 240,
          width: 930,
          zIndex: 2,
        }}
      >
        <Reveal frame={frame}>
          <Eyebrow>The next chapter is yours</Eyebrow>
        </Reveal>
        <Reveal frame={frame} delay={7} style={{ marginTop: 33 }}>
          <Headline size={110}>
            Your next PR
            <br />
            starts <span style={{ color: p.orange }}>here.</span>
          </Headline>
        </Reveal>
        <Reveal
          frame={frame}
          delay={22}
          style={{ marginTop: 34, fontSize: type.body, color: p.muted }}
        >
          A plan. A record. A reason to keep going.
        </Reveal>
        <Reveal frame={frame} delay={34} style={{ marginTop: 43 }}>
          <div
            style={{
              width: "fit-content",
              display: "flex",
              alignItems: "center",
              gap: 38,
              padding: "25px 31px",
              borderRadius: 18,
              background: p.orange,
              color: "#1a1008",
              boxShadow: "0 12px 45px #ff7a241c",
              fontSize: 29,
              fontWeight: 650,
            }}
          >
            Start training with FitFlow
            <ArrowRight size={31} />
          </div>
        </Reveal>
        <Reveal
          frame={frame}
          delay={48}
          style={{
            marginTop: 31,
            display: "flex",
            alignItems: "center",
            gap: 23,
            fontSize: 20,
            color: p.muted,
          }}
        >
          {["Free to use", "No sign-up", "824 exercises"].map((text) => (
            <span
              key={text}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <Check size={18} color={p.orange} />
              {text}
            </span>
          ))}
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1015,
          top: 174,
          transform: `translateX(${(1 - entrance(frame, 18)) * 180}px) rotate(-12deg) scale(0.77)`,
          opacity: progress(frame, 18, 34),
          transformOrigin: "50% 65%",
        }}
      >
        <Phone activeTab={2}>
          <ProgramsScreen />
        </Phone>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1435,
          top: 174,
          transform: `translateX(${(1 - entrance(frame, 25)) * -100}px) rotate(12deg) scale(0.77)`,
          opacity: progress(frame, 25, 40),
          transformOrigin: "50% 65%",
        }}
      >
        <Phone activeTab={3}>
          <ProgressScreen frame={140} />
        </Phone>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1240,
          top: 151,
          transform: `translateY(${(1 - entrance(frame, 7)) * 90}px) scale(0.91)`,
          opacity: progress(frame, 7, 23),
        }}
      >
        <Phone>
          <WorkoutScreen frame={90 + frame} compact />
        </Phone>
      </div>
    </AbsoluteFill>
  );
}

function Transitions() {
  const frame = useCurrentFrame();
  return (
    <>
      {cuts.slice(1, -1).map((cut) => {
        const local = frame - cut;
        if (local < -10 || local > 12) return null;
        // Full coverage exactly at the scene cut; both sides of the wipe are deterministic.
        const x = interpolate(local, [-10, 0, 12], [-2050, 0, 2050], clamp);
        return (
          <div
            key={cut}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 2050,
              background: p.orange,
              transform: `translateX(${x}px) skewX(-9deg)`,
              boxShadow: "-35px 0 0 #21150e",
            }}
          />
        );
      })}
    </>
  );
}

export function FitFlowPromo() {
  return (
    <AbsoluteFill
      style={{
        fontFamily: '"Geist", sans-serif',
        fontSynthesis: "none",
        color: p.text,
        fontVariantNumeric: "tabular-nums",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Backdrop />
      <Sequence from={0} durationInFrames={120} name="You bring the effort">
        <Opening />
      </Sequence>
      <Sequence
        from={120}
        durationInFrames={210}
        name="Less tapping. More lifting."
      >
        <Logging />
      </Sequence>
      <Sequence
        from={330}
        durationInFrames={180}
        name="Turn effort into evidence"
      >
        <Progress />
      </Sequence>
      <Sequence
        from={510}
        durationInFrames={180}
        name="Zero signal. Full focus."
      >
        <Offline />
      </Sequence>
      <Sequence
        from={690}
        durationInFrames={210}
        name="Your next PR starts here"
      >
        <Closing />
      </Sequence>
      <Chrome />
      <Transitions />
      <Html5Audio src={staticFile("audio/fitflow-pulse.wav")} volume={0.85} />
    </AbsoluteFill>
  );
}
