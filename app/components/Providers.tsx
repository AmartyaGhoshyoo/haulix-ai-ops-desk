"use client";

import { ReactNode, useEffect } from "react";
import { MotionConfig } from "motion/react";
import Lenis from "lenis";

// Smooth, inertial scrolling (skipped under reduced motion); anchors keep #links working.
export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: { offset: -72 } });
    return () => lenis.destroy();
  }, []);
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
