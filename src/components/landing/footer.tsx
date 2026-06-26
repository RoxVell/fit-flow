import Link from "next/link";
import { Dumbbell } from "lucide-react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Programs", href: "/programs/library" },
  { label: "Progress", href: "/progress" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="font-mono text-sm font-bold text-foreground">
              FitFlow
            </p>
            <p className="text-xs text-muted-foreground">
              Made for strength training · v{APP_VERSION}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
