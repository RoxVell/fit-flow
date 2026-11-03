import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

/** The exported film is served as media; Remotion stays out of the app bundle. */
export function PromoVideo() {
  return (
    <section
      id="film"
      aria-labelledby="film-title"
      className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-24 sm:pb-32"
    >
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Play aria-hidden className="size-3.5" fill="currentColor" />
            Meet your next training partner
          </p>
          <h2
            id="film-title"
            className="mt-3 max-w-2xl text-balance text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl"
          >
            30 seconds. A better way to train.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Less tapping between sets. More clarity after every session.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-primary/10 sm:rounded-3xl">
        <video
          controls
          playsInline
          preload="none"
          width={1920}
          height={1080}
          poster="/videos/fitflow-promo-poster.jpg"
          aria-label="FitFlow: a 30-second introduction to workout logging, progress tracking, and offline training"
          aria-describedby="film-description"
          className="aspect-video w-full bg-zinc-950 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-400"
        >
          <source src="/videos/fitflow-promo.mp4" type="video/mp4" />
          <track
            src="/videos/fitflow-promo.en.vtt"
            kind="captions"
            srcLang="en"
            label="English"
          />
          Your browser does not support embedded video.{" "}
          <a href="/videos/fitflow-promo.mp4">Watch the FitFlow film.</a>
        </video>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-7">
          <p id="film-description" className="text-sm text-zinc-400">
            Every rep counted. Even with zero bars.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-orange-400 transition-colors hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
          >
            Start your next session
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>

      <details className="mt-4 rounded-xl text-sm text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded-md py-2 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          Read the video description
        </summary>
        <p className="mt-2 max-w-3xl text-pretty leading-relaxed">
          FitFlow turns your training into a history you can follow. The film
          shows a workout with previous-set numbers, one-tap set logging, and an
          automatic rest timer. Progress charts and personal records help you see
          how your lifts change over time. Your workouts stay on your device and
          remain available offline after the app has loaded. Choose from 824
          exercises and start training without creating an account. Training
          numbers shown in the film are illustrative. The soundtrack contains
          music only; the message is also shown on screen.
        </p>
      </details>
    </section>
  );
}
