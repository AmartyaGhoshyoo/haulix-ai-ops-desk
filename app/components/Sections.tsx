"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useScroll, useTransform } from "motion/react";
import {
  AlertTriangle,
  Boxes,
  FileText,
  Inbox,
  MessageCircle,
  Receipt,
  Route,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AGENTS, CHANNELS, FEED, GUARDRAILS, SHIPMENTS, SITE } from "../data/site";
import { openAssistant } from "./assistant/Assistant";
import { Rise, RiseWords, Wrap, ease } from "./kit";

const AGENT_ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  receipt: Receipt,
  route: Route,
  truck: Truck,
  boxes: Boxes,
  alert: AlertTriangle,
  message: MessageCircle,
  file: FileText,
  wallet: Wallet,
};

export function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(17,19,23,0)", "rgba(17,19,23,0.88)"]);
  return (
    <motion.header style={{ backgroundColor: bg }} className="fixed inset-x-0 top-0 z-40 backdrop-blur-md">
      <Wrap className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-extrabold uppercase tracking-wide">
          <span className="grid h-7 w-7 place-items-center rounded bg-signal text-[0.9rem] text-graphite">H</span>
          {SITE.name}
        </a>
        <nav className="hidden gap-7 text-[0.92rem] text-ink/70 md:flex">
          <a href="#journey" className="hover:text-ink">How it works</a>
          <a href="#agents" className="hover:text-ink">Agents</a>
          <a href="#console" className="hover:text-ink">Live desk</a>
          <a href="#trust" className="hover:text-ink">Guardrails</a>
        </nav>
        <button onClick={() => openAssistant("chat")} className="min-h-[40px] cursor-pointer rounded-md bg-signal px-4 text-[0.88rem] font-bold uppercase text-graphite">
          Try the agent
        </button>
      </Wrap>
    </motion.header>
  );
}

export function Marquee() {
  const items = ["Orders", "Quotes", "Routes", "Dispatch", "Warehouse", "Customs", "Exceptions", "Billing", "Claims", "Customer updates"];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-signal py-3 text-graphite">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-10 whitespace-nowrap font-extrabold uppercase tracking-wide">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t} <span aria-hidden>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Agents() {
  return (
    <section id="agents" className="gridlines relative py-28">
      <Wrap>
        <p className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-signal">The crew</p>
        <h2 className="mt-4 max-w-[48rem] font-display text-[clamp(2.3rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.95]">
          <RiseWords text="Nine agents. *One desk.*" accent="text-signal" />
        </h2>
        <p className="mt-5 max-w-[38rem] text-ink/65">
          Each agent owns one job and hands work to the next — the way a good ops team does. They share one shipment record, so nobody retypes anything.
        </p>
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => {
            const Icon = AGENT_ICONS[a.icon] ?? Inbox;
            return (
              <Rise key={a.name} delay={(i % 3) * 0.08}>
                <motion.div
                  whileHover={{ y: -6, rotateX: 4, rotateY: -4 }}
                  style={{ transformPerspective: 900 }}
                  className="group relative h-full overflow-hidden rounded-lg border border-ink/10 bg-panel p-6 transition-colors hover:border-signal/50"
                >
                  <span className="absolute right-5 top-5 font-mono text-[0.72rem] text-ink/30">0{i + 1}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-signal/12 text-signal ring-1 ring-signal/30 transition-colors group-hover:bg-signal group-hover:text-graphite">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-[1.25rem] font-bold">{a.name}</h3>
                  <p className="mt-1.5 text-ink/60">{a.does}</p>
                  <span className="mt-5 flex items-center gap-2 font-mono text-[0.72rem] text-ok">
                    <span className="h-1.5 w-1.5 animate-[blink_1.6s_infinite] rounded-full bg-ok" /> on duty
                  </span>
                </motion.div>
              </Rise>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}

function Count({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, to, { duration: 1.6, ease, onUpdate: (v) => ref.current && (ref.current.textContent = v.toFixed(decimals) + suffix) });
    return () => c.stop();
  }, [inView, to, suffix, decimals]);
  return <span ref={ref}>0{suffix}</span>;
}

const STATUS_TONE: Record<string, string> = {
  low: "bg-ok/15 text-ok",
  medium: "bg-signal/15 text-signal",
  high: "bg-danger/15 text-danger",
};

export function Console() {
  const [log, setLog] = useState(() => FEED.slice(0, 4).map((t, i) => ({ t, id: i })));
  useEffect(() => {
    let n = 4;
    const id = setInterval(() => {
      setLog((l) => [{ t: FEED[n % FEED.length]!, id: n }, ...l].slice(0, 5));
      n++;
    }, 3000);
    return () => clearInterval(id);
  }, []);
  const time = (k: number) => `14:${String((k * 7 + 3) % 60).padStart(2, "0")}`;

  return (
    <section id="console" className="relative py-28">
      <Wrap>
        <p className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-signal">The live desk</p>
        <h2 className="mt-4 max-w-[52rem] font-display text-[clamp(2.3rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.95]">
          <RiseWords text="Your whole network, *one screen.*" accent="text-signal" />
        </h2>
        <Rise delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-xl border border-ink/12 bg-panel shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
              </div>
              <p className="font-mono text-[0.72rem] text-ink/45">haulix · operations desk · demo data</p>
            </div>
            <div className="grid grid-cols-2 border-b border-ink/10 md:grid-cols-4">
              {[
                { k: "Shipments moving", v: <Count to={1284} /> },
                { k: "On time", v: <Count to={97.4} decimals={1} suffix="%" /> },
                { k: "Handled by agents", v: <Count to={82} suffix="%" /> },
                { k: "Waiting for you", v: <Count to={3} /> },
              ].map((s, i) => (
                <div key={s.k} className={`p-5 ${i ? "border-l border-ink/10" : ""} ${i === 2 ? "max-md:border-l-0 max-md:border-t" : ""} ${i === 3 ? "max-md:border-t" : ""}`}>
                  <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/45">{s.k}</p>
                  <p className={`mt-1 text-[2rem] font-extrabold ${i === 3 ? "text-signal" : ""}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-x-auto p-5">
                <table className="w-full min-w-[520px] text-left text-[0.9rem]">
                  <thead className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/45">
                    <tr>
                      <th className="pb-3 font-normal">ID</th>
                      <th className="pb-3 font-normal">Lane</th>
                      <th className="pb-3 font-normal">Mode</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHIPMENTS.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => openAssistant("chat", `Track ${s.id}`)}
                        className="cursor-pointer border-t border-ink/8 transition-colors hover:bg-ink/[0.04]"
                      >
                        <td className="py-3 font-mono text-signal">{s.id}</td>
                        <td className="py-3">{s.lane}</td>
                        <td className="py-3 text-ink/60">{s.mode}</td>
                        <td className="py-3">
                          <span className={`rounded px-2 py-0.5 text-[0.78rem] font-semibold ${STATUS_TONE[s.risk]}`}>{s.status}</span>
                        </td>
                        <td className="py-3 font-mono text-[0.84rem] text-ink/70">{s.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 font-mono text-[0.72rem] text-ink/40">Tap a row to ask the agent about it.</p>
              </div>
              <div className="border-t border-ink/10 p-5 lg:border-l lg:border-t-0">
                <p className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-ink/45">
                  <span className="h-1.5 w-1.5 animate-[blink_1.2s_infinite] rounded-full bg-ok" /> Agent log
                </p>
                <ul className="mt-3 space-y-2">
                  <AnimatePresence initial={false}>
                    {log.map((l, i) => (
                      <motion.li
                        key={l.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1 - i * 0.14, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease }}
                        className="rounded-md bg-graphite/60 px-3 py-2 font-mono text-[0.78rem] leading-snug"
                      >
                        <span className="text-ink/40">{time(l.id)} </span>
                        {l.t}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
          </div>
        </Rise>
      </Wrap>
    </section>
  );
}

export function Trust() {
  return (
    <section id="trust" className="relative py-28">
      <div className="tape absolute inset-x-0 top-0 h-2 opacity-80" />
      <Wrap className="grid gap-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-signal">Guardrails</p>
          <h2 className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] font-extrabold uppercase leading-[0.95]">
            <RiseWords text="Autonomous, *never unsupervised.*" accent="text-signal" />
          </h2>
          <p className="mt-5 max-w-[30rem] text-ink/65">
            Built on the same rule as Nofa, our clinic receptionist: the AI does the legwork, a person makes the call when money or promises are involved.
          </p>
          <div className="mt-10">
            <p className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/45">Reach Haulix on</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <span key={c} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-[0.88rem]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUARDRAILS.map((g, i) => (
            <Rise key={g.rule} delay={i * 0.08}>
              <div className="h-full rounded-lg border border-ink/10 bg-panel p-6">
                <ShieldCheck className="text-signal" size={22} />
                <h3 className="mt-4 text-[1.15rem] font-bold">{g.rule}</h3>
                <p className="mt-2 text-[0.94rem] text-ink/60">{g.detail}</p>
              </div>
            </Rise>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

export function Finale() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_50%_100%,rgba(255,210,63,0.16),transparent_70%)]" />
      <Wrap className="relative text-center">
        <h2 className="mx-auto max-w-[56rem] font-display text-[clamp(2.6rem,7vw,6rem)] font-extrabold uppercase leading-[0.92]">
          <RiseWords text="Hand the busywork *to the agents.*" accent="text-signal" />
        </h2>
        <p className="mx-auto mt-6 max-w-[34rem] text-ink/65">Ask Haulix about a shipment, a quote or a delay — by chat or by voice. This is a demo with sample data.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button onClick={() => openAssistant("voice")} className="min-h-[52px] cursor-pointer rounded-md bg-signal px-7 font-bold uppercase text-graphite">
            Talk to Haulix
          </button>
          <a href={`mailto:${SITE.email}?subject=Haulix`} className="flex min-h-[52px] items-center rounded-md border border-ink/25 px-7 font-bold uppercase hover:bg-ink/5">
            Book a walkthrough
          </a>
        </div>
      </Wrap>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink/10 py-10">
      <Wrap className="flex flex-col items-center justify-between gap-3 text-[0.88rem] text-ink/50 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE.name} · built by{" "}
          <a href={SITE.by.url} className="text-ink/80 underline-offset-4 hover:underline">
            {SITE.by.name}
          </a>
        </p>
        <p className="font-mono text-[0.76rem]">Demo · sample data · agents run in preview mode</p>
      </Wrap>
    </footer>
  );
}
