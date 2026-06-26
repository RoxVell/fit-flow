import { WifiOff, Languages, MoonStar, Smartphone } from "lucide-react";
import { Reveal } from "./reveal";

const claims = [
  { icon: WifiOff, label: "100% offline-first" },
  { icon: Languages, label: "English & Русский" },
  { icon: MoonStar, label: "Light & dark themes" },
  { icon: Smartphone, label: "Installable PWA" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-card/40 backdrop-blur-sm">
      <Reveal>
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 text-sm text-muted-foreground">
          {claims.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="size-4 text-primary" />
              <span className="font-medium text-foreground/80">{label}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
