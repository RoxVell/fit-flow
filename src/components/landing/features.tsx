import {
  CalendarDays,
  ListChecks,
  TrendingUp,
  WifiOff,
  Activity,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

type Feature = {
  icon: typeof CalendarDays;
  title: string;
  body: string;
  /** Bento placement classes — which column/row the tile spans. */
  className: string;
  /** Emphasized tiles get a primary-tinted surface and larger type. */
  emphasis?: boolean;
};

const features: Feature[] = [
  {
    icon: ListChecks,
    title: "Real-time set logging",
    body: "Log every set in the gym with auto-filled previous weights, a rest timer floating above the nav, and a live volume counter that ticks up as you go.",
    className: "sm:col-span-2 sm:row-span-2",
    emphasis: true,
  },
  {
    icon: TrendingUp,
    title: "Progress & PRs",
    body: "Track e1RM, volume, and personal records over time.",
    className: "sm:col-span-2",
  },
  {
    icon: CalendarDays,
    title: "Smart programs",
    body: "PPL, Upper/Lower, or your own split — assigned to weekdays.",
    className: "",
  },
  {
    icon: WifiOff,
    title: "Offline-first",
    body: "Your data lives on your device. Train and sync when you're back online.",
    className: "",
  },
  {
    icon: Activity,
    title: "Muscle heatmap",
    body: "Visualize training load across your body to stay balanced.",
    className: "sm:col-span-2",
  },
  {
    icon: Sparkles,
    title: "AI briefing",
    body: "An AI read on your last two weeks, plus per-exercise advice.",
    className: "sm:col-span-2",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Everything you need to lift
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A focused toolkit for strength training — no fluff, no cloud
            lock-in, no subscriptions.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-5 sm:grid-cols-4">
            {features.map(({ icon: Icon, title, body, className, emphasis }) => (
              <article
                key={title}
                className={cn(
                  "group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5 hover:ring-primary/30",
                  className
                )}
              >
                {/* Emphasized tiles get a tinted surface + glow accent */}
                {emphasis && (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-3xl"
                    />
                    <Dumbbell
                      aria-hidden
                      className="pointer-events-none absolute -bottom-6 -right-3 size-32 text-primary/10 transition-transform group-hover:rotate-12"
                    />
                  </>
                )}

                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors",
                      emphasis
                        ? "bg-primary text-primary-foreground ring-primary/30"
                        : "bg-primary/10 text-primary ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3
                    className={cn(
                      "font-semibold text-foreground",
                      emphasis ? "text-2xl" : "text-lg"
                    )}
                  >
                    {title}
                  </h3>
                </div>

                <p
                  className={cn(
                    "relative leading-relaxed text-muted-foreground",
                    emphasis ? "text-base" : "text-sm"
                  )}
                >
                  {body}
                </p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
