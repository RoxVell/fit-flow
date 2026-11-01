"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export function AppMotionProvider({ children }: { children: ReactNode }) {
  // Keep a renderer available during hydration; defer the drag/layout features.
  const [features, setFeatures] = useState(domAnimation);

  useEffect(() => {
    let active = true;
    import("@/lib/motion-features")
      .then((module) => {
        if (active) setFeatures(module.default);
      })
      .catch((error: unknown) => {
        // Basic animations remain available if the extra chunk cannot load.
        console.warn("[motion] Could not load drag and layout features", error);
      });
    return () => {
      active = false;
    };
  }, []);

  return <LazyMotion features={features} strict>{children}</LazyMotion>;
}
