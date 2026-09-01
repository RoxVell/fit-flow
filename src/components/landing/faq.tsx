"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. There is nothing to sign up for. Open the app and start logging. Nothing leaves your phone unless you deliberately configure sync.",
  },
  {
    q: "Where does my data live?",
    a: "In your browser's local database (IndexedDB) on the device you use. The exercise library ships inside the app too, so browsing and logging work with no connection at all.",
  },
  {
    q: "What if I switch phones?",
    a: "Export your history to CSV from the Workout → History tab at any time. If you want live cross-device sync, point FitFlow at your own Postgres database. It is off by default.",
  },
  {
    q: "How do I install it on iPhone?",
    a: "Open FitFlow in Safari, tap Share, then Add to Home Screen. It launches full-screen from the icon, with no browser chrome. Android and desktop Chrome offer an install prompt directly.",
  },
  {
    q: "Is it free?",
    a: "Yes. FitFlow is open source, has no subscription and no paid tier. Run it yourself or use a hosted copy, the app is the same.",
  },
  {
    q: "What does the progress index measure?",
    a: "It compares your estimated one-rep max across every exercise to your first week, so 118% means you are lifting roughly 18% more than when you started. Per-exercise charts show e1RM and volume separately.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title={
              <>
                Questions,{" "}
                <span className="lp-serif text-primary">answered straight.</span>
              </>
            }
            body="The short version: it's your data, on your phone, for free. The long version is below."
          />

          <Reveal delay={0.1}>
            <ul className="divide-y divide-border/70 border-y border-border/70">
              {faqs.map((item, i) => {
                const isOpen = open === i;
                return (
                  <li key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    >
                      <span
                        className={cn(
                          "text-lg font-medium transition-colors",
                          isOpen ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                          isOpen ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-foreground/15"
                        )}
                      >
                        <Plus className="size-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-${i}`}
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-6 text-base leading-relaxed text-muted-foreground">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
