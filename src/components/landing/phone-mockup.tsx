import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A pure-CSS phone frame used to showcase faux app screens on the landing
 * page. No image assets — everything is built from the app's own design
 * tokens so it tracks light/dark automatically.
 */
export function PhoneMockup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[280px] rounded-[2.75rem] border border-foreground/15 bg-card p-2.5 shadow-2xl shadow-foreground/20 ring-1 ring-foreground/5",
        className
      )}
    >
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-24 h-12 w-[3px] rounded-l bg-foreground/20" />
      <div className="absolute -left-[3px] top-40 h-16 w-[3px] rounded-l bg-foreground/20" />
      <div className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-foreground/20" />

      {/* Screen */}
      <div className="relative h-[560px] overflow-hidden rounded-[2.2rem] bg-background">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-card" />
        <div className="h-full w-full pt-6">{children}</div>
      </div>
    </div>
  );
}
