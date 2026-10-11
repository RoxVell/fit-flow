import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--fl-line)] px-6 py-8">
      <div className="fl-mono mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[0.7rem] tracking-[0.16em] text-[var(--fl-muted)] uppercase">
        <span>FitFlow — built for the long game</span>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="transition-colors hover:text-[var(--fl-text)]">
            Open app
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
