"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";

export const ease = [0.22, 1, 0.36, 1] as const;

export function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Fades and lifts its children in when scrolled into view. */
export function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Words rise one by one when the line scrolls into view; *a few words* get the accent class. */
export function RiseWords({ text, className = "", accent = "text-[var(--accent-ink)]" }: { text: string; className?: string; accent?: string }) {
  // Accent spans can cover several words: a word is accented if a "*" opened before it and hasn't closed.
  const parts = text.split(" ");
  const words = parts.map((raw, i) => {
    const before = parts.slice(0, i).join(" ");
    const open = (before.match(/\*/g)?.length ?? 0) % 2 === 1;
    return { word: raw.replace(/^\*|\*$/g, ""), isAccent: open || raw.startsWith("*") };
  });
  return (
    <motion.span className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10% 0px" }}>
      {words.map(({ word, isAccent }, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-top">
            <motion.span
              className={`inline-block ${isAccent ? accent : ""}`}
              variants={{ hidden: { y: "115%" }, show: { y: "0%", transition: { duration: 0.85, delay: i * 0.05, ease } } }}
            >
              {word}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </motion.span>
  );
}
