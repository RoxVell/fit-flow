import { CountUp } from "./count-up";
import { Reveal } from "./reveal";

const stats = [
  { value: 824, label: "exercises, illustrated and offline" },
  { value: 100, suffix: "%", label: "of your data stays on the device" },
  { value: 2, label: "languages, down to every exercise name" },
  { value: 0, label: "accounts, emails or subscriptions" },
];

export function Numbers() {
  return (
    <section aria-label="By the numbers" className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="relative flex flex-col border-l border-border pl-5">
            <dt className="order-2 mt-2 text-sm leading-snug text-muted-foreground">{s.label}</dt>
            <dd className="order-1 font-mono text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              <CountUp to={s.value} suffix={s.suffix} />
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
