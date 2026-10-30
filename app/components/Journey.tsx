"use client";

// "One shipment, six agents": a pinned scroll story. Each chapter swaps the stage on the
// right for that agent's live mock-up (email → booking, quotes, route, warehouse, reroute, POD).
import { ReactNode, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { CHAPTERS } from "../data/site";
import { RiseWords, Wrap, ease } from "./kit";

export default function Journey() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setStep(Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(p * CHAPTERS.length)))));
  const c = CHAPTERS[step]!;

  return (
    <section ref={ref} id="journey" className="relative lg:h-[520vh]">
      <div className="sticky top-0 hidden h-screen items-center lg:flex">
        <Wrap className="grid grid-cols-[1fr_1.1fr] items-center gap-14">
          <div>
            <p className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-ink/50">One shipment · six agents</p>
            <div className="relative mt-6 h-[22rem]">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease }} className="absolute inset-0">
                  <p className="font-mono text-[0.8rem] text-signal">
                    0{step + 1} / {c.agent}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(2.2rem,3.8vw,3.4rem)] font-extrabold uppercase leading-[0.98]">
                    {c.title.replace(/\*/g, "")}
                  </h2>
                  <p className="mt-5 max-w-[32rem] text-[1.05rem] leading-relaxed text-ink/65">{c.body}</p>
                  <p className="mt-6 font-display text-[2.4rem] font-extrabold text-signal">
                    {c.stat} <span className="ml-1 font-mono text-[0.8rem] font-normal uppercase tracking-wider text-ink/50">{c.statLabel}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex gap-1.5">
              {CHAPTERS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-10 bg-signal" : i < step ? "w-5 bg-ink/40" : "w-5 bg-ink/15"}`} />
              ))}
            </div>
          </div>
          <Stage step={step} />
        </Wrap>
      </div>

      <Wrap className="space-y-16 py-24 lg:hidden">
        <p className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-ink/50">One shipment · six agents</p>
        {CHAPTERS.map((ch, i) => (
          <div key={ch.agent}>
            <p className="font-mono text-[0.8rem] text-signal">
              0{i + 1} / {ch.agent}
            </p>
            <h2 className="mt-2 font-display text-[2.1rem] font-extrabold uppercase leading-[1]">
              <RiseWords text={ch.title} accent="text-signal" />
            </h2>
            <p className="mt-3 text-ink/65">{ch.body}</p>
            <div className="mt-6">
              <Stage step={i} />
            </div>
          </div>
        ))}
      </Wrap>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink/12 bg-panel shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-signal" />
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink/60">{title}</p>
      </div>
      <div className="min-h-[22rem] p-5">{children}</div>
    </div>
  );
}

const appear = (d: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d, ease } });

function Stage({ step }: { step: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, rotateY: -12, scale: 0.97 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 12, scale: 0.97 }} transition={{ duration: 0.55, ease }} style={{ transformPerspective: 1400 }}>
        {step === 0 && <Intake />}
        {step === 1 && <Quotes />}
        {step === 2 && <Route />}
        {step === 3 && <Warehouse />}
        {step === 4 && <Exception />}
        {step === 5 && <Billing />}
      </motion.div>
    </AnimatePresence>
  );
}

function Intake() {
  return (
    <Panel title="Intake agent · inbox">
      <motion.div {...appear(0)} className="rounded-md border border-ink/10 bg-graphite/60 p-3 font-mono text-[0.8rem] leading-relaxed text-ink/75">
        <p className="text-ink/45">From: ops@rahmantextiles.com</p>
        <p className="mt-1">“Hi, need 12 cartons (300kg) picked up tomorrow morning from our Tejgaon factory to Kolkata DC. Invoice attached.”</p>
      </motion.div>
      <motion.p {...appear(0.4)} className="my-3 text-center font-mono text-[0.75rem] text-signal">
        ▼ parsed in 38 s
      </motion.p>
      <motion.div {...appear(0.7)} className="grid grid-cols-2 gap-2 text-[0.86rem]">
        {[
          ["Shipper", "Rahman Textiles"],
          ["Pickup", "Tejgaon, Dhaka · tomorrow 10–12"],
          ["Deliver to", "Kolkata DC"],
          ["Cargo", "12 cartons · 300 kg"],
          ["Docs", "Invoice ✓ · packing list missing"],
          ["Next", "Asked customer for packing list"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md bg-graphite/50 px-3 py-2">
            <p className="font-mono text-[0.68rem] uppercase text-ink/45">{k}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </motion.div>
    </Panel>
  );
}

function Quotes() {
  const rows = [
    ["Air express", "$1,840", "2 days", "1.9 t", true],
    ["Sea-air", "$1,120", "6 days", "0.7 t", false],
    ["Ocean LCL", "$640", "14 days", "0.2 t", false],
  ] as const;
  return (
    <Panel title="Quoting agent · Dhaka → Singapore, 300 kg">
      <div className="space-y-2">
        {rows.map(([n, p, d, c, best], i) => (
          <motion.div key={n} {...appear(i * 0.15)} className={`grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center rounded-md px-4 py-3 ${best ? "bg-signal text-graphite" : "bg-graphite/60"}`}>
            <span className="font-bold">{n}</span>
            <span className="font-mono">{p}</span>
            <span className="font-mono">{d}</span>
            <span className="font-mono">{c} CO₂</span>
          </motion.div>
        ))}
      </div>
      <motion.div {...appear(0.6)} className="mt-5 rounded-md border border-signal/40 p-3 text-[0.9rem]">
        <b className="text-signal">Proposed:</b> Air express — under the $2,000 limit, so it can book now. Above the limit, a manager approves.
      </motion.div>
    </Panel>
  );
}

function Route() {
  return (
    <Panel title="Route planner · truck DH-4471 · 9 stops">
      <svg viewBox="0 0 400 260" className="h-[20rem] w-full">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="rgba(245,245,240,0.06)" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill="url(#grid)" />
        <motion.path
          d="M30 220 C 80 200, 70 140, 120 130 S 200 170, 220 110 S 300 60, 330 90 S 360 190, 370 40"
          fill="none"
          stroke="#FFD23F"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
        />
        {[
          [30, 220], [120, 130], [170, 150], [220, 110], [275, 70], [330, 90], [352, 150], [365, 100], [370, 40],
        ].map(([x, y], i) => (
          <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.2 }}>
            <circle cx={x} cy={y} r="9" fill={i === 0 ? "#FFD23F" : "#1C2027"} stroke="#FFD23F" strokeWidth="2" />
            <text x={x} y={(y ?? 0) + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill={i === 0 ? "#111317" : "#F5F5F0"}>
              {i === 0 ? "D" : i}
            </text>
          </motion.g>
        ))}
        <motion.circle r="6" fill="#fff" initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} style={{ offsetPath: "path('M30 220 C 80 200, 70 140, 120 130 S 200 170, 220 110 S 300 60, 330 90 S 360 190, 370 40')" }} />
      </svg>
      <p className="font-mono text-[0.8rem] text-ink/60">New order at 14:02 → all 9 stops re-sequenced · −23 km · windows kept</p>
    </Panel>
  );
}

function Warehouse() {
  const fills = [92, 64, 18, 77, 45, 88, 31, 70, 55, 96, 12, 60];
  return (
    <Panel title="Warehouse agent · Dhaka hub · bays A-1 → A-14">
      <div className="grid grid-cols-6 gap-2">
        {fills.map((f, i) => (
          <motion.div key={i} {...appear(i * 0.04)} className="relative h-24 overflow-hidden rounded-md border border-ink/10 bg-graphite/60">
            <motion.div className={`absolute inset-x-0 bottom-0 ${f < 20 ? "bg-danger" : "bg-signal/80"}`} initial={{ height: 0 }} animate={{ height: `${f}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease }} />
            <span className="absolute left-1.5 top-1 font-mono text-[0.62rem] text-ink/70">A-{i + 1}</span>
          </motion.div>
        ))}
      </div>
      <motion.div {...appear(0.8)} className="mt-5 flex items-center justify-between gap-3 rounded-md border border-danger/40 p-3">
        <p className="text-[0.9rem]">
          <b className="text-danger">A-11 at 12%</b> — runs out in ~3 days. Reorder 400 cartons ($860)?
        </p>
        <span className="shrink-0 rounded bg-signal px-3 py-1.5 text-[0.8rem] font-bold text-graphite">Approve</span>
      </motion.div>
    </Panel>
  );
}

function Exception() {
  return (
    <Panel title="Exception agent · HX-2041 at risk">
      <svg viewBox="0 0 400 220" className="h-[15rem] w-full">
        <text x="20" y="40" fill="#F5F5F0" fontSize="11" fontWeight="700">Chittagong</text>
        <text x="300" y="40" fill="#F5F5F0" fontSize="11" fontWeight="700">Rotterdam</text>
        <path d="M60 50 Q 200 200 330 50" fill="none" stroke="rgba(255,90,90,0.7)" strokeDasharray="6 6" strokeWidth="2.5" />
        <text x="170" y="150" fill="#FF5A5A" fontSize="10" fontWeight="700">✕ Singapore congestion · +14 h</text>
        <motion.path d="M60 50 Q 160 10 200 70 T 330 50" fill="none" stroke="#FFD23F" strokeWidth="3.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.3 }} />
        <text x="150" y="25" fill="#FFD23F" fontSize="10" fontWeight="700">via Colombo · −9 h · +$120</text>
      </svg>
      <motion.div {...appear(1.2)} className="flex items-center justify-between gap-3 rounded-md bg-signal/10 p-3 ring-1 ring-signal/40">
        <p className="text-[0.9rem]">Reroute prepared. New ETA Nov 18. Customer message drafted.</p>
        <span className="shrink-0 rounded bg-signal px-3 py-1.5 text-[0.8rem] font-bold text-graphite">Approve reroute</span>
      </motion.div>
    </Panel>
  );
}

function Billing() {
  return (
    <Panel title="Billing & claims agent · HX-2032 delivered">
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.div {...appear(0)} className="rounded-md bg-graphite/60 p-4">
          <p className="font-mono text-[0.68rem] uppercase text-ink/45">Proof of delivery</p>
          <p className="mt-1 font-semibold">Signed · M. Ahmed · 16:42</p>
          <p className="text-[0.85rem] text-ink/55">Photo ✓ · GPS match ✓ · 12/12 cartons</p>
        </motion.div>
        <motion.div {...appear(0.2)} className="rounded-md bg-graphite/60 p-4">
          <p className="font-mono text-[0.68rem] uppercase text-ink/45">Invoice INV-7781</p>
          <p className="mt-1 font-semibold">$1,840.00 · matches quote</p>
          <p className="text-[0.85rem] text-ink/55">Fuel surcharge checked ✓</p>
        </motion.div>
      </div>
      <motion.div {...appear(0.5)} className="mt-4 rounded-md border border-ok/40 p-4">
        <p className="font-bold text-ok">✓ Ready to send</p>
        <p className="mt-1 text-[0.9rem] text-ink/65">One damaged carton reported → claim pack assembled (photos, timeline, carrier liability) for review.</p>
      </motion.div>
    </Panel>
  );
}
