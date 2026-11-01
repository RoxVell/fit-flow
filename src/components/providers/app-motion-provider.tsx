"use client";

import { LazyMotion, domMax } from "framer-motion";
import type { ReactNode } from "react";

export function AppMotionProvider({ children }: { children: ReactNode }) {
  // Swipe deletion is essential: load drag support with the screen itself.
  return <LazyMotion features={domMax} strict>{children}</LazyMotion>;
}
