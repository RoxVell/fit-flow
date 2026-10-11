"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowUpRight, Dumbbell, Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "FAQ", href: "#faq" },
];

export function LandingHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <motion.div
        layout
        className={cn(
          "mx-auto flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition-[background-color,border-color,box-shadow,max-width] duration-500 sm:px-4",
          scrolled
            ? "max-w-4xl border-border/70 bg-background/75 shadow-lg shadow-foreground/5 backdrop-blur-xl"
            : "max-w-6xl border-transparent bg-transparent"
        )}
      >
        <Link href="/landing" className="group flex items-center gap-2.5" aria-label="FitFlow home">
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:rotate-[-8deg]">
            <Dumbbell className="size-4.5" />
          </span>
          <span className="font-mono text-base font-bold tracking-tight text-foreground">
            FitFlow
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeButton />
          <Link
            href="/dashboard"
            className="lp-sheen hidden h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:-translate-y-px active:translate-y-px sm:inline-flex"
          >
            Open app
            <ArrowUpRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="lp-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="lp-mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto mt-2 flex max-w-4xl flex-col gap-1 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-xl shadow-foreground/10 backdrop-blur-xl md:hidden"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="mt-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Open app
              <ArrowUpRight className="size-4" />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until hydration; render a neutral icon on the server.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background/60 text-foreground transition-colors hover:bg-muted"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={mounted ? (dark ? "moon" : "sun") : "none"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
          className="flex"
        >
          {mounted && dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function subscribeNoop() {
  return () => {};
}
