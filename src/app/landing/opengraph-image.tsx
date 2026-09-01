import { ImageResponse } from "next/og";

export const alt = "FitFlow — Every rep counted. Even with zero bars.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ORANGE = "#f26b1d";

/**
 * Social card, rendered at build time. Pure flexbox + gradients: Satori has
 * no CSS grid, no `filter: blur` and no custom fonts without a font file, so
 * this needs no assets.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0b0b0d",
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(242,107,29,0.38) 0%, rgba(242,107,29,0) 42%), radial-gradient(circle at 92% 95%, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0) 45%), linear-gradient(135deg, #0b0b0d 0%, #141216 60%, #1b1410 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            width: 720,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: ORANGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              F
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>FitFlow</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5, display: "flex", flexDirection: "column" }}>
              <span>Every rep counted.</span>
              <span style={{ color: ORANGE }}>Even with zero bars.</span>
            </div>
            <div style={{ fontSize: 24, color: "rgba(250,250,250,0.7)", lineHeight: 1.35, maxWidth: 560 }}>
              Offline-first strength tracker. No account, no subscription, your data on your phone.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {["Offline-first", "824 exercises", "PR detection", "Installable"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 18,
                  color: "rgba(250,250,250,0.85)",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 90,
            width: 300,
            height: 620,
            borderRadius: 48,
            background: "#18181b",
            border: "2px solid rgba(255,255,255,0.14)",
            display: "flex",
            flexDirection: "column",
            padding: 14,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 36,
              background: "#0f0f11",
              display: "flex",
              flexDirection: "column",
              padding: "40px 16px 16px",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: 18,
                background: "rgba(242,107,29,0.14)",
                border: "1px solid rgba(242,107,29,0.3)",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: ORANGE, fontSize: 22, fontWeight: 700 }}>24:18</span>
                <span style={{ fontSize: 12, color: "rgba(250,250,250,0.6)" }}>9/14 sets · 3,510 kg</span>
              </div>
              <div style={{ background: ORANGE, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>
                Finish
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                borderRadius: 18,
                background: "#18181b",
                border: "1px solid rgba(242,107,29,0.5)",
                padding: 14,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700 }}>Bench Press</span>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ color: "rgba(250,250,250,0.5)", width: 12 }}>{n}</span>
                  <span style={{ color: "rgba(250,250,250,0.4)", flex: 1 }}>80 × 5</span>
                  <span style={{ background: "#0f0f11", borderRadius: 6, padding: "3px 8px" }}>82.5</span>
                  <span style={{ background: "#0f0f11", borderRadius: 6, padding: "3px 8px" }}>5</span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      background: n < 3 ? ORANGE : "transparent",
                      border: `1px solid ${n < 3 ? ORANGE : "rgba(255,255,255,0.3)"}`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderRadius: 18,
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: `4px solid ${ORANGE}`,
                  borderRightColor: "rgba(255,255,255,0.15)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 11, color: "rgba(250,250,250,0.55)" }}>Rest</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>01:12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
