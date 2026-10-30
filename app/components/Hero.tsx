"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FEED, SITE } from "../data/site";
import { openAssistant } from "./assistant/Assistant";
import Globe from "./Globe";
import { Wrap, ease } from "./kit";

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % FEED.length), 2600);
    return () => clearInterval(id);
  }, []);
  const rise = (d: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.85, delay: d, ease } });

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_72%_45%,rgba(255,210,63,0.10),transparent_70%)]" />
      <Wrap className="relative grid min-h-[calc(100svh-6rem)] items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 py-10">
          <motion.p {...rise(0.05)} className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-signal">
            ● {SITE.tagline}
          </motion.p>
          <motion.h1 {...rise(0.15)} className="mt-5 font-display text-[clamp(3rem,7.6vw,6.6rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em]">
            Freight that <span className="text-signal">runs itself.</span>
          </motion.h1>
          <motion.p {...rise(0.3)} className="mt-6 max-w-[34rem] text-[1.1rem] leading-relaxed text-ink/70">
            Nine AI agents read your orders, quote the lanes, plan the routes, watch every shipment and fix problems before
            customers notice — then ask a person before anything costly happens.
          </motion.p>
          <motion.div {...rise(0.45)} className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={() => openAssistant("voice")}
              className="min-h-[52px] cursor-pointer rounded-md bg-signal px-6 font-bold uppercase tracking-wide text-graphite transition-transform hover:-translate-y-0.5"
            >
              Talk to Haulix
            </button>
            <button
              onClick={() => openAssistant("chat", "Any delays on my shipments?")}
              className="min-h-[52px] cursor-pointer rounded-md border border-ink/25 px-6 font-bold uppercase tracking-wide hover:bg-ink/5"
            >
              Check my shipments
            </button>
          </motion.div>
          <motion.div {...rise(0.6)} className="mt-10 max-w-[34rem] rounded-md border border-ink/12 bg-panel/80 p-4 backdrop-blur">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink/50">Agent activity · live</p>
            <div className="relative mt-2 h-12 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={i}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="absolute inset-0 font-mono text-[0.86rem] leading-snug"
                >
                  <span className="text-signal">▸ </span>
                  {FEED[i]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay: 0.2, ease }} className="relative h-[52vh] min-h-[360px] lg:h-[86vh]">
          <Globe className="absolute inset-0" />
          <div className="absolute bottom-[12%] left-[6%] rounded-md border border-signal/40 bg-graphite/85 px-3 py-2 font-mono text-[0.74rem] backdrop-blur">
            <span className="text-signal">HX-2041</span> Chittagong → Rotterdam · rerouted via Colombo · −9 h
          </div>
        </motion.div>
      </Wrap>
    </section>
  );
}
