"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fade, rise and un-blur once when scrolled into view. Under
 * `prefers-reduced-motion` the surrounding <MotionConfig> collapses this to a
 * plain opacity fade.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 20,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "section" | "li" | "span" | "p";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Tag>
  );
}
