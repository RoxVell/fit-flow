import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A pure-CSS phone frame for faux app screens. Built from the app's own
 * design tokens so it tracks light/dark automatically; no image assets.
 */
export function PhoneMockup({
  children,
  className,
  screenClassName,
}: {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[286px] rounded-[3rem] border border-foreground/15 bg-card p-2.5 shadow-2xl shadow-foreground/20 ring-1 ring-foreground/5",
        className
      )}
    >
      {/* Side buttons */}
      <div aria-hidden className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-foreground/25" />
      <div aria-hidden className="absolute -left-[3px] top-40 h-16 w-[3px] rounded-l bg-foreground/25" />
      <div aria-hidden className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-foreground/25" />

      {/* Screen */}
      <div
        className={cn(
          "relative h-[580px] overflow-hidden rounded-[2.4rem] bg-background",
          screenClassName
        )}
      >
        {/* Status bar + dynamic island */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-foreground">
          <span className="font-mono">9:41</span>
          <div className="absolute left-1/2 top-2.5 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-card ring-1 ring-foreground/10" />
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-4 rounded-[3px] border border-foreground/60 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-foreground/80" />
            </span>
          </span>
        </div>
        <div className="h-full w-full pt-9">{children}</div>
      </div>
    </div>
  );
}
