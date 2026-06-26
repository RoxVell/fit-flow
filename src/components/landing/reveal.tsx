"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Lightweight fade-and-rise entrance for marketing sections. Animates once
 * when scrolled into view; the content renders normally (just at the end
 * state via the `whileInView` fallback) if JS/animation is unavailable.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
