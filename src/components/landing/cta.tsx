import Link from "next/link";
import { ArrowRight, Dumbbell, Share, Smartphone } from "lucide-react";
import { Reveal } from "./reveal";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 sm:pb-32">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-zinc-950 px-6 py-20 text-center text-white shadow-2xl shadow-primary/20 ring-1 ring-white/10 sm:px-16 sm:py-28">
          {/* Aurora */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="lp-aurora absolute left-[-10%] top-[-30%] h-[70%] w-[60%] rounded-full bg-primary/70 blur-[120px]" />
            <div
              className="lp-aurora absolute bottom-[-30%] right-[-10%] h-[80%] w-[55%] rounded-full bg-amber-400/30 blur-[130px]"
              style={{ animationDelay: "-12s", animationDirection: "reverse" }}
            />
            <div
              className="lp-aurora absolute left-[30%] top-[30%] h-[50%] w-[40%] rounded-full bg-rose-500/20 blur-[120px]"
              style={{ animationDelay: "-6s" }}
            />
            <div className="lp-dots lp-drift absolute inset-0 opacity-[0.35] [--foreground:#fff]" />
          </div>
          <div className="lp-grain -z-10" aria-hidden />

          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Your next PR is{" "}
            <span className="lp-serif text-amber-200">one tap away.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/70">
            Open FitFlow, pick a split, and log the first set. It runs right in
            your browser, and it keeps running when the signal doesn&apos;t.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="lp-sheen group inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-zinc-950 shadow-xl shadow-black/30 transition-transform hover:-translate-y-0.5 active:translate-y-px sm:w-auto"
            >
              <Dumbbell className="size-5 text-primary" />
              Open FitFlow
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 text-sm font-medium text-white/85 backdrop-blur sm:w-auto">
              <Smartphone className="size-4" />
              Then
              <Share className="size-3.5" />
              Add to Home Screen
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
