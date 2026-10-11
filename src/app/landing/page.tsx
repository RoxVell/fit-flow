import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Hero } from "@/components/landing/hero";
import { Ticker } from "@/components/landing/ticker";
import { LiveLog } from "@/components/landing/live-log";
import { PlateRack } from "@/components/landing/plate-rack";
import { ProgressChart } from "@/components/landing/progress-chart";
import { ForgeCta } from "@/components/landing/forge-cta";
import { Footer } from "@/components/landing/footer";
import { LandingMotionConfig } from "@/components/landing/motion-config";
import "./landing.css";

// Self-hosted: the dev machine can't always reach fonts.googleapis.com,
// and an offline-first app shouldn't depend on it anyway.
const anton = localFont({
  src: "./fonts/anton-latin.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "FitFlow — Every rep. Every kilo. Counted.",
  description:
    "An offline-first training log for people who run real programs. Build the plan, log sets as you lift, and watch your e1RM climb — even with no signal.",
  openGraph: {
    title: "FitFlow — Every rep. Every kilo. Counted.",
    description:
      "Offline-first training log: programs, live set logging, rest timer, automatic PRs, and progress analytics.",
    type: "website",
  },
};

/** Bar-and-plates logo mark, echoing the hero. */
function LogoMark() {
  return (
    <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden>
      <rect x="0" y="8.5" width="32" height="3" rx="1.5" fill="var(--fl-muted)" />
      <rect x="5" y="2" width="3.4" height="16" rx="1.6" fill="var(--fl-ember)" />
      <rect x="9.6" y="4.5" width="2.8" height="11" rx="1.4" fill="var(--fl-ember)" opacity="0.7" />
      <rect x="23.6" y="2" width="3.4" height="16" rx="1.6" fill="var(--fl-ember)" />
      <rect x="19.6" y="4.5" width="2.8" height="11" rx="1.4" fill="var(--fl-ember)" opacity="0.7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className={`fl ${anton.variable} relative min-h-dvh`}>
      <header className="sticky top-0 z-30 border-b border-[var(--fl-line)] bg-[rgb(12_10_8/0.8)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/landing" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="fl-display text-lg tracking-[0.04em]">FitFlow</span>
          </Link>
          <nav className="fl-mono hidden items-center gap-8 text-[0.72rem] tracking-[0.18em] text-[var(--fl-muted)] uppercase sm:flex">
            <Link href="#log" className="transition-colors hover:text-[var(--fl-text)]">
              The set
            </Link>
            <Link href="#rack" className="transition-colors hover:text-[var(--fl-text)]">
              The rack
            </Link>
            <Link href="#progress" className="transition-colors hover:text-[var(--fl-text)]">
              Progress
            </Link>
          </nav>
          <Link href="/dashboard" className="fl-btn h-9 px-4 text-sm">
            Open app
          </Link>
        </div>
      </header>

      <LandingMotionConfig>
        <main>
          <Hero />
          <Ticker />
          <LiveLog />
          <PlateRack />
          <ProgressChart />
          <ForgeCta />
        </main>
      </LandingMotionConfig>

      <Footer />
    </div>
  );
}
