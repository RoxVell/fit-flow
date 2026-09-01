import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <span aria-hidden className="h-px w-5 bg-primary" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
    </Reveal>
  );
}
