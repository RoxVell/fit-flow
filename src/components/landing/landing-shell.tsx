"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the marketing page so every Framer Motion animation honours the
 * visitor's `prefers-reduced-motion` setting (transforms are dropped,
 * opacity fades are kept).
 */
export function LandingShell({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
