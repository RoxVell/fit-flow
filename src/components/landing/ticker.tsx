/*
 * A chalkboard ticker of log lines — the raw material of the app.
 * PR entries burn ember; everything else stays chalk.
 */

const ENTRIES: Array<{ text: string; pr?: boolean }> = [
  { text: "SQUAT 140×5", pr: true },
  { text: "REST 02:30" },
  { text: "BENCH 102.5×3" },
  { text: "+2.5 KG NEXT SESSION" },
  { text: "DEADLIFT 180×1", pr: true },
  { text: "PULL-UP BW×12" },
  { text: "SYNCED · OFFLINE ✓" },
  { text: "WEEK 7 — DELOAD" },
  { text: "OHP 60×5" },
  { text: "e1RM 152.3 KG", pr: true },
  { text: "ROW 90×8" },
  { text: "REST 01:30" },
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 py-3.5 pr-10"
      aria-hidden={hidden}
    >
      {ENTRIES.map((e) => (
        <span
          key={e.text}
          className={`fl-mono text-[0.78rem] tracking-[0.14em] whitespace-nowrap ${
            e.pr ? "text-[var(--fl-ember)]" : "text-[var(--fl-muted)]"
          }`}
        >
          {e.text}
          {e.pr && <span className="ml-2 font-bold">PR</span>}
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div className="fl-ticker">
      <div className="fl-ticker-track">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
