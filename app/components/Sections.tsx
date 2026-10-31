"use client";

// Glass sections that scroll over the HD planet: hero, the agent workstation, the nine agents,
// network numbers, guardrails, and the closing call to action.
import { ReactNode, useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "motion/react";
import { ArrowRight, Boxes, FileText, Globe, Inbox, MessageSquare, Receipt, Route, ShieldCheck, TriangleAlert, Truck, Wallet, type LucideIcon } from "lucide-react";
import { AGENTS, CHANNELS, GUARDRAILS, SITE } from "../data/site";
import { openAssistant } from "./assistant/Assistant";
import { ease } from "./kit";
import Workstation from "./Workstation";

const AGENT_ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  receipt: Receipt,
  route: Route,
  truck: Truck,
  boxes: Boxes,
  alert: TriangleAlert,
  message: MessageSquare,
  file: FileText,
  wallet: Wallet,
};

/** Fade-up on first view, with a per-element delay (ms). */
function Reveal({ children, d = 0, className = "" }: { children: ReactNode; d?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.7, delay: d / 1000, ease }}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-4 font-mono text-[0.72rem] font-medium uppercase tracking-[0.2em] text-radar-soft">{children}</p>;
}

function Count({ to, prefix = "", suffix = "", decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease, onUpdate: (v) => ref.current && (ref.current.textContent = prefix + v.toFixed(decimals) + suffix) });
    return () => c.stop();
  }, [inView, to, prefix, suffix, decimals]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${solid ? "border-b border-white/[0.06] bg-[#050814]/70 backdrop-blur-xl" : ""}`}>
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 font-display text-[1.15rem] font-bold tracking-[0.12em]">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-radar">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          HAULIX
        </a>
        <nav className="hidden gap-8 text-[0.9rem] text-ink/60 md:flex">
          <a href="#workstation" className="hover:text-ink">Workstation</a>
          <a href="#agents" className="hover:text-ink">Agents</a>
          <a href="#network" className="hover:text-ink">Network</a>
          <a href="#trust" className="hover:text-ink">Guardrails</a>
        </nav>
        <button onClick={() => openAssistant("voice")} className="min-h-[40px] cursor-pointer rounded-full border border-white/15 bg-white/[0.05] px-4 text-[0.88rem] font-medium backdrop-blur hover:bg-white/10">
          Talk to the desk
        </button>
      </div>
    </header>
  );
}

const LOGOS = ["Meridian Freight", "Kestrel Lines", "Orbit Pharma", "Rahman Textiles", "Delta Cold", "Northgate 3PL"];

export function Hero() {
  return (
    <header id="top" className="relative flex min-h-[100svh] flex-col" style={{ background: "radial-gradient(130% 72% at 50% -8%, rgba(3,5,14,.9) 0%, rgba(3,5,14,.55) 46%, transparent 74%)" }}>
      <div className="flex flex-1 -translate-y-[12vh] flex-col items-center justify-center px-5 pt-24 text-center">
        <Reveal d={40}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[0.72rem] text-ink/70 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> 9 AI agents · on shift 24/7
          </p>
        </Reveal>
        <Reveal d={120}>
          <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.4rem,5.6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em] [text-shadow:0_2px_50px_rgba(0,0,0,.55)]">
            Every shipment, <span className="bg-gradient-to-b from-[#9db8ff] to-radar bg-clip-text text-transparent">handled.</span>
          </h1>
        </Reveal>
        <Reveal d={240}>
          <p className="mx-auto mt-6 max-w-[36rem] text-[clamp(1rem,2vw,1.15rem)] leading-relaxed text-ink/65">
            Haulix is an operations desk run by AI agents. They turn messages into bookings, plan and re-plan routes, catch problems early — and bring every costly decision to a person.
          </p>
        </Reveal>
        <Reveal d={360} className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#workstation" className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-radar px-6 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(47,107,255,0.7)] transition-transform hover:-translate-y-0.5">
            Open the workstation <ArrowRight size={17} />
          </a>
          <a href={`mailto:${SITE.email}?subject=Haulix demo`} className="inline-flex min-h-[50px] items-center rounded-full border border-white/20 bg-white/[0.04] px-6 font-semibold backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/10">
            Book a demo
          </a>
        </Reveal>
      </div>
      <Reveal d={480} className="px-5 pb-12 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/40">Running the night shift for</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {LOGOS.map((l) => (
            <span key={l} className="text-[1rem] font-semibold text-ink/60 transition-colors hover:text-ink [text-shadow:0_1px_18px_rgba(3,5,14,.9)]">
              {l}
            </span>
          ))}
        </div>
      </Reveal>
    </header>
  );
}

export function WorkstationSection() {
  return (
    <section id="workstation" className="relative mx-auto max-w-[1180px] px-4 py-[clamp(80px,12vw,150px)] sm:px-6">
      <div className="mx-auto mb-12 max-w-[680px] text-center">
        <Reveal><Eyebrow>The workstation</Eyebrow></Reveal>
        <Reveal d={80}>
          <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.1rem)] font-bold leading-[1.06] tracking-[-0.02em] [text-shadow:0_2px_40px_rgba(0,0,0,.6)]">One screen. Nine agents. You make the calls.</h2>
        </Reveal>
        <Reveal d={160}>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink/60">This is live. Orders stream in and become bookings. Open Routes and drop in a 2 pm order. Approve or decline what the exception agent proposes.</p>
        </Reveal>
      </div>
      <Reveal d={120}>
        <Workstation />
      </Reveal>
    </section>
  );
}

export function Agents() {
  return (
    <section id="agents" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vw,150px)] sm:px-6">
      <div className="mx-auto mb-12 max-w-[680px] text-center">
        <Reveal><Eyebrow>The team</Eyebrow></Reveal>
        <Reveal d={80}>
          <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.1rem)] font-bold leading-[1.06] tracking-[-0.02em]">Each agent owns one job, end to end</h2>
        </Reveal>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a, i) => {
          const Icon = AGENT_ICONS[a.icon] ?? Inbox;
          return (
            <Reveal key={a.name} d={(i % 3) * 90}>
              <article className="glass group h-full rounded-[18px] p-6 transition-all duration-300 hover:-translate-y-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-radar/25 bg-radar/10 text-radar-soft">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 text-[1.1rem] font-semibold">{a.name} agent</h3>
                <p className="mt-1.5 text-[0.93rem] leading-relaxed text-ink/60">{a.does}</p>
                <p className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-[0.72rem] leading-relaxed text-ok/90">Today · {a.today}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function Network() {
  const bars = [62, 88, 47, 95, 71, 80, 58];
  const rows = [
    { k: "Bookings drafted", w: 92 },
    { k: "Auto-booked < $500", w: 64 },
    { k: "Re-plans accepted", w: 81 },
    { k: "WISMO answered", w: 81 },
  ];
  return (
    <section id="network" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vw,150px)] sm:px-6">
      <div className="grid items-center gap-[clamp(36px,6vw,72px)] lg:grid-cols-[1fr_1.05fr]">
        <div className="text-center lg:text-left">
          <Reveal><Eyebrow>The network</Eyebrow></Reveal>
          <Reveal d={90}>
            <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.1rem)] font-bold leading-[1.06] tracking-[-0.02em]">24 hubs, 22 lanes, watched every second</h2>
          </Reveal>
          <Reveal d={180}>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink/60">Ports, airports and depots from Chattogram to Rotterdam. When a lane turns red on the globe, the exception agent is already drafting a plan.</p>
          </Reveal>
          <Reveal d={270} className="mt-7">
            <button onClick={() => openAssistant("chat", "Where is HX-2041?")} className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-radar px-6 font-semibold text-white">
              Track a shipment <ArrowRight size={17} />
            </button>
          </Reveal>
        </div>
        <Reveal d={160}>
          <div className="glass-strong rounded-[26px] p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Agent throughput · this week</p>
              <span className="flex items-center gap-1.5 text-[0.8rem] text-ok">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> Live
              </span>
            </div>
            <div className="mt-5 flex h-[150px] items-end gap-2.5 rounded-2xl border border-white/[0.06] bg-black/25 p-4">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 origin-bottom rounded-t-md rounded-b-sm bg-gradient-to-b from-[#6e95ff] to-[#2f6bff]/25"
                  style={{ height: `${h}%` }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.09, ease }}
                />
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {rows.map((r) => (
                <div key={r.k} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-[0.85rem] text-ink/60 sm:grid-cols-[150px_1fr_40px]">
                  <span>{r.k}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.span className="block h-full rounded-full bg-gradient-to-r from-radar to-[#9db8ff]" initial={{ width: 0 }} whileInView={{ width: `${r.w}%` }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3, ease }} />
                  </span>
                  <span className="text-right font-mono text-[0.75rem] text-ink/70">{r.w}%</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-[clamp(56px,8vw,96px)] grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { v: <Count to={97.4} decimals={1} suffix="%" />, k: "Deliveries on time" },
          { v: <Count to={38} suffix=" s" />, k: "From email to booking draft" },
          { v: <Count to={412} prefix="−" suffix=" km" />, k: "Saved by re-plans today" },
          { v: <Count to={81} suffix="%" />, k: "“Where's my parcel?” handled" },
        ].map((s, i) => (
          <Reveal key={s.k} d={i * 80}>
            <div className="glass rounded-[18px] px-4 py-7 text-center">
              <p className="bg-gradient-to-b from-white to-[#9db8ff] bg-clip-text font-display text-[clamp(1.6rem,3.6vw,2.6rem)] font-bold text-transparent">{s.v}</p>
              <p className="mt-2 text-[0.88rem] text-ink/55">{s.k}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Trust() {
  return (
    <section id="trust" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vw,150px)] sm:px-6">
      <div className="mx-auto mb-12 max-w-[680px] text-center">
        <Reveal><Eyebrow>Guardrails</Eyebrow></Reveal>
        <Reveal d={80}>
          <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.1rem)] font-bold leading-[1.06] tracking-[-0.02em]">Autonomous where it’s safe. Supervised where it matters.</h2>
        </Reveal>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GUARDRAILS.map((g, i) => (
          <Reveal key={g.rule} d={i * 80}>
            <div className="glass flex h-full gap-4 rounded-[18px] p-6">
              <ShieldCheck className="mt-0.5 shrink-0 text-ok" size={22} strokeWidth={1.6} />
              <div>
                <h3 className="font-semibold">{g.rule}</h3>
                <p className="mt-1.5 text-[0.93rem] leading-relaxed text-ink/60">{g.detail}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal d={200} className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-[0.85rem] text-ink/45">Customers reach the desk on</span>
        {CHANNELS.map((c) => (
          <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.82rem] text-ink/70">
            {c}
          </span>
        ))}
      </Reveal>
    </section>
  );
}

export function Closing() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-5 pb-10 pt-[clamp(80px,12vw,150px)] sm:px-6">
      <div className="glass-strong mx-auto max-w-[760px] rounded-[26px] px-[clamp(24px,5vw,64px)] py-[clamp(44px,7vw,80px)] text-center" style={{ background: "radial-gradient(120% 140% at 50% 0%, rgba(47,107,255,.16), transparent 55%), rgba(12,17,36,.68)" }}>
        <Reveal><Eyebrow>Ready for tonight’s shift</Eyebrow></Reveal>
        <Reveal d={80}>
          <h2 className="font-display text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-[1.06] tracking-[-0.02em]">Hand the busywork to agents. Keep the decisions.</h2>
        </Reveal>
        <Reveal d={160}>
          <p className="mx-auto mt-5 max-w-[30rem] text-ink/60">Connect your inbox, WhatsApp and carriers in a week. Start with one lane; add agents as you trust them.</p>
        </Reveal>
        <Reveal d={240} className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${SITE.email}?subject=Haulix demo`} className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-radar px-6 font-semibold text-white">
            Book a demo <ArrowRight size={17} />
          </a>
          <button onClick={() => openAssistant("voice")} className="min-h-[50px] cursor-pointer rounded-full border border-white/20 bg-white/[0.04] px-6 font-semibold backdrop-blur hover:bg-white/10">
            Talk to the desk
          </button>
        </Reveal>
      </div>
      <footer className="mt-[clamp(64px,9vw,110px)] flex flex-wrap justify-between gap-10 border-t border-white/[0.07] pt-10">
        <div>
          <p className="flex items-center gap-2 font-display font-bold tracking-[0.12em]">
            <Globe size={16} className="text-radar-soft" /> HAULIX
          </p>
          <p className="mt-2 max-w-[18rem] text-[0.88rem] text-ink/50">The AI operations desk for logistics. A Zovak product.</p>
        </div>
        <div className="grid grid-cols-3 gap-10 text-[0.88rem]">
          {[
            ["Product", ["Workstation", "Agents", "Network"]],
            ["Company", ["Zovak", "Contact", "Careers"]],
            ["Legal", ["Privacy", "Terms", "Credits"]],
          ].map(([h, items]) => (
            <div key={h as string}>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">{h as string}</p>
              <ul className="mt-3 space-y-2 text-ink/65">
                {(items as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      <p className="mt-12 text-center text-[0.8rem] text-ink/40">
        © {new Date().getFullYear()} Haulix by {SITE.by.name}. Earth imagery: Solar System Scope (CC BY 4.0), based on NASA data. Demo data only.
      </p>
    </section>
  );
}
