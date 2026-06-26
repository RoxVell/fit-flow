import Link from "next/link";
import { Dumbbell, ArrowRight, Smartphone } from "lucide-react";
import { Reveal } from "./reveal";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 px-8 py-16 text-center shadow-2xl shadow-primary/30 sm:px-16">
          {/* Decorative glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-black/10 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
              Your strongest self starts today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-primary-foreground/80">
              Open FitFlow, build your first program, and start logging. It
              works right in your browser — no install required.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-background px-7 text-base font-semibold text-foreground shadow-lg transition-transform active:translate-y-px sm:w-auto"
              >
                <Dumbbell className="size-5 text-primary" />
                Open FitFlow
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-primary-foreground/30 px-5 text-sm font-medium text-primary-foreground/90">
                <Smartphone className="size-4" />
                Or add to your home screen
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
