import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function ForgeCta() {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-40">
      {/* forge glow rising from below */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 100%, rgb(255 90 0 / 0.2), rgb(255 61 0 / 0.07) 45%, transparent 75%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl text-center">
        <Reveal>
          <h2 className="fl-display fl-heat-text text-[clamp(3.5rem,13vw,10rem)]">
            Add weight.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-[var(--fl-muted)]">
            The next session is already planned. All that&apos;s left is to lift
            it and log it.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-5">
            <Link href="/dashboard" className="fl-btn h-13 px-9 text-base">
              Open FitFlow
              <ArrowRight className="size-4" />
            </Link>
            <span className="fl-mono text-[0.7rem] tracking-[0.18em] text-[var(--fl-muted)] uppercase">
              Free · no account · your data stays on your device
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
