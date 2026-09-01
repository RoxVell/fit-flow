import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { LandingShell } from "@/components/landing/landing-shell";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Ticker } from "@/components/landing/ticker";
import { Bento } from "@/components/landing/bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Numbers } from "@/components/landing/numbers";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import "@/components/landing/landing.css";

// Editorial italic for the accent words in headings. Loaded only on this
// route; the app itself stays on Geist.
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const TITLE = "FitFlow — Every rep counted. Even with zero bars.";
const DESCRIPTION =
  "An offline-first strength tracker that installs like an app, needs no account, and keeps every set on your phone. Programs, one-tap set logging, auto rest timer, PR detection and progress charts.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "workout tracker",
    "strength training app",
    "offline workout log",
    "PWA fitness app",
    "one rep max calculator",
    "push pull legs",
  ],
  alternates: { canonical: "/landing" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/landing",
    siteName: "FitFlow",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FitFlow",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web, iOS, Android",
  description: DESCRIPTION,
  url: `${SITE_URL}/landing`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Offline-first workout logging",
    "824 illustrated exercises",
    "Automatic rest timer",
    "Personal record detection",
    "Estimated 1RM and volume charts",
    "English and Russian",
  ],
};

export default function LandingPage() {
  return (
    <LandingShell>
      <div className={`lp-root relative min-h-dvh ${instrumentSerif.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>

        <LandingHeader />

        <main id="main">
          <Hero />
          <Ticker />
          <Bento />
          <HowItWorks />
          <Numbers />
          <Faq />
          <Cta />
        </main>

        <Footer />
      </div>
    </LandingShell>
  );
}
