import {
  Activity,
  Download,
  Languages,
  Library,
  MoonStar,
  Smartphone,
  Timer,
  TrendingUp,
  Trophy,
  UserX,
  WifiOff,
} from "lucide-react";

const items = [
  { icon: WifiOff, label: "Offline-first" },
  { icon: UserX, label: "No account" },
  { icon: Library, label: "824 exercises" },
  { icon: Timer, label: "Auto rest timer" },
  { icon: Trophy, label: "PR detection" },
  { icon: TrendingUp, label: "e1RM & volume charts" },
  { icon: Activity, label: "Muscle heatmap" },
  { icon: Languages, label: "English & Русский" },
  { icon: MoonStar, label: "Light & dark" },
  { icon: Smartphone, label: "Installable PWA" },
  { icon: Download, label: "CSV export" },
];

/** An infinite, pause-on-hover ticker of what ships in the box. */
export function Ticker() {
  return (
    <section aria-label="Highlights" className="lp-marquee-pause relative py-6">
      <div className="lp-mask-x overflow-hidden">
        <ul className="lp-marquee flex w-max items-center gap-3 pr-3" style={{ "--lp-duration": "46s" } as React.CSSProperties}>
          {[...items, ...items].map(({ icon: Icon, label }, i) => (
            <li
              key={`${label}-${i}`}
              aria-hidden={i >= items.length}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-foreground/85 backdrop-blur"
            >
              <Icon className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
