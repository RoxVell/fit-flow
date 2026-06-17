"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  innerH: number;
  vvH: number;
  docClientH: number;
  dvh: number;
  shellH: number;
  navBottom: number;
  navPaddingBottom: string;
  gap: number;
};

function measureDvh(): number {
  if (typeof document === "undefined") return 0;
  const el = document.createElement("div");
  el.style.cssText =
    "position:absolute;left:-9999px;top:0;height:100dvh;width:1px;pointer-events:none;";
  document.documentElement.appendChild(el);
  const h = el.getBoundingClientRect().height;
  el.remove();
  return Math.round(h);
}

function snapshot(): Snapshot {
  const vv = window.visualViewport;
  const shell = document.querySelector(".app-shell") as HTMLElement | null;
  const nav = document.querySelector("nav") as HTMLElement | null;
  const innerH = window.innerHeight;
  const vvH = vv?.height ?? innerH;
  const navBottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : -1;
  const navPaddingBottom = nav
    ? getComputedStyle(nav).paddingBottom
    : "n/a";
  return {
    innerH,
    vvH: Math.round(vvH),
    docClientH: document.documentElement.clientHeight,
    dvh: measureDvh(),
    shellH: shell ? Math.round(shell.getBoundingClientRect().height) : -1,
    navBottom,
    navPaddingBottom,
    gap: navBottom >= 0 ? Math.round(innerH - navBottom) : -1,
  };
}

export function ViewportDebug() {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    const update = () => setSnap(snapshot());
    update();
    // rAF + small delays so we catch iOS's late layout settles.
    const timeouts = [60, 300, 800].map((d) =>
      window.setTimeout(update, d)
    );
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  if (!snap) return null;

  const rows: [string, string | number][] = [
    ["window.innerHeight", snap.innerH],
    ["visualViewport.h", snap.vvH],
    ["documentEl.clientHeight", snap.docClientH],
    ["100dvh (measured)", snap.dvh],
    [".app-shell height", snap.shellH],
    ["nav bottom (rect)", snap.navBottom],
    ["nav paddingBottom", snap.navPaddingBottom],
    ["GAP innerH - navBottom", snap.gap],
  ];

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "min(94vw, 28rem)",
        padding: "6px 8px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.82)",
        color: "#7CFC00",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 10.5,
        lineHeight: 1.35,
        pointerEvents: "none",
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ color: "#fff", fontWeight: 700, marginBottom: 2 }}>
        VIEWPORT DEBUG (px)
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{k}</span>
          <span style={{ color: v === 0 || (typeof v === "number" && v < 0) ? "#ff6b6b" : "#ffd166", fontWeight: 700 }}>
            {String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}
