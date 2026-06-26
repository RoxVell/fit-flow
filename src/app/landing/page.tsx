import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { TrustBar } from "@/components/landing/trust-bar";
import { Features } from "@/components/landing/features";
import { Showcase } from "@/components/landing/showcase";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "FitFlow — Train smarter. Track every gain.",
  description:
    "An offline-first strength training PWA. Build programs, log sets in real time, and watch your progress climb — all on your phone, even offline.",
  openGraph: {
    title: "FitFlow — Train smarter. Track every gain.",
    description:
      "An offline-first strength training PWA. Build programs, log sets in real time, and track every PR.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    // Transparent wrapper lets the global BlockOne grid (fixed -z-10) show
    // through as a decorative backdrop, layered under the orange body glow
    // already defined in globals.css.
    <div className="relative min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="size-4" />
            </div>
            <span className="font-mono text-base font-bold text-foreground">
              FitFlow
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:translate-y-px"
          >
            Open app
          </Link>
        </div>
      </header>

      <main>
        <Hero />
        <TrustBar />
        <Features />
        <Showcase />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}
