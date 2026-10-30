"use client";

// Page sections floating over the 3D world. Each section has data-cam="…": the camera flies
// to that station while the section is on screen. Buttons here drive the world (events).
import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useScroll, useTransform } from "motion/react";
import {
  AlertTriangle,
  Boxes,
  Check,
  CloudLightning,
  FileText,
  Inbox,
  MessageCircle,
  Plus,
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
import { WORLD_EVENT } from "./World";

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
const fire = (name: string, detail?: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));

function Kicker({ children, tone = "text-radar-soft" }: { children: ReactNode; tone?: string }) {
  return (
    <p className={`flex items-center gap-2 font-mono text-[0.74rem] uppercase tracking-[0.22em] ${tone}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
        <span className="relative h-2 w-2 rounded-full bg-current" />
      </span>
      {children}
    </p>
  );
}

function Count({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, to, { duration: 1.6, ease, onUpdate: (v) => ref.current && (ref.current.textContent = v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix) });
    return () => c.stop();
  }, [inView, to, suffix, decimals]);
  return <span ref={ref}>0{suffix}</span>;
}

export function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 160], ["rgba(10,13,26,0)", "rgba(10,13,26,0.8)"]);
  return (
    <motion.header style={{ backgroundColor: bg }} className="fixed inset-x-0 top-0 z-40 backdrop-blur-md">
      <Wrap className="flex h-16 items-center justify-between">
        <a href="#network" className="flex items-center gap-2.5 font-extrabold uppercase tracking-[0.12em]">
          <span className="relative grid h-8 w-8 place-items-center rounded-full border border-radar/60">
            <span className="absolute inset-1 animate-ping rounded-full border border-radar/40" />
            <span className="h-2 w-2 rounded-full bg-flare" />
          </span>
          {SITE.name}
        </a>
        <nav className="hidden gap-8 font-mono text-[0.8rem] uppercase tracking-wider text-ink/65 md:flex">
          <a href="#network" className="hover:text-ink">Network</a>
          <a href="#fleet" className="hover:text-ink">Fleet</a>
          <a href="#tower" className="hover:text-ink">Control tower</a>
          <a href="#rules" className="hover:text-ink">Rules</a>
        </nav>
        <button onClick={() => openAssistant("voice")} className="min-h-[40px] cursor-pointer rounded-full bg-radar px-5 text-[0.86rem] font-bold text-white shadow-[0_0_30px_-6px_#2f6bff]">
          Call the desk
        </button>
      </Wrap>
    </motion.header>
  );
}

export function Network() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % FEED.length), 2600);
    return () => clearInterval(id);
  }, []);
  const rise = (d: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: d, ease } });
  return (
    <section id="network" data-cam="globe" className="relative flex min-h-[100svh] items-end pb-14 pt-[44vh] md:items-center md:pt-28">
      <Wrap>
        <div className="max-w-[44rem]">
          <motion.div {...rise(0.05)}>
            <Kicker>{SITE.tagline}</Kicker>
          </motion.div>
          <motion.h1 {...rise(0.15)} className="mt-5 text-[clamp(3rem,8vw,7.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.03em]">
            Freight that
            <br />
            <span className="glow-text">runs itself.</span>
          </motion.h1>
          <motion.p {...rise(0.3)} className="mt-6 max-w-[34rem] text-[1.1rem] leading-relaxed text-ink/75">
            Nine AI agents watch your whole network — orders, quotes, trucks, ports and storms — fix problems before customers notice, and ask a person before anything costly happens.
          </motion.p>
          <motion.div {...rise(0.45)} className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => openAssistant("chat", "Any delays on my shipments?")} className="min-h-[52px] cursor-pointer rounded-full bg-flare px-7 font-bold text-white shadow-[0_0_40px_-8px_#ff3b5c]">
              Check my shipments
            </button>
            <a href="#fleet" className="flex min-h-[52px] items-center rounded-full border border-ink/25 px-7 font-bold hover:bg-ink/5">
              Fly down to the fleet ↓
            </a>
          </motion.div>
        </div>
        <motion.div {...rise(0.6)} className="mt-12 grid max-w-[60rem] gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="hud rounded-2xl p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink/50">Agent activity · live</p>
            <div className="relative mt-1.5 h-11 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p key={i} initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -22, opacity: 0 }} transition={{ duration: 0.45, ease }} className="absolute inset-0 font-mono text-[0.8rem] leading-snug">
                  <span className="text-flare">▸ </span>
                  {FEED[i]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          {[
            { k: "Shipments moving", v: <Count to={1284} /> },
            { k: "On time", v: <Count to={97.4} decimals={1} suffix="%" /> },
            { k: "Handled by agents", v: <Count to={82} suffix="%" /> },
          ].map((s) => (
            <div key={s.k} className="hud rounded-2xl p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.15em] text-ink/50">{s.k}</p>
              <p className="mt-1 text-[1.8rem] font-extrabold">{s.v}</p>
            </div>
          ))}
        </motion.div>
      </Wrap>
    </section>
  );
}

export function Fleet() {
  const [saved, setSaved] = useState(412);
  const [log, setLog] = useState<string[]>(["14:02 · 36 trucks on plan · all windows kept"]);
  const [busy, setBusy] = useState(false);
  const drop = () => {
    if (busy) return;
    setBusy(true);
    fire(WORLD_EVENT.replan);
    const km = 9 + Math.floor(Math.random() * 18);
    setTimeout(() => {
      setSaved((s) => s + km);
      setLog((l) => [`${new Date().toTimeString().slice(0, 5)} · new order dropped in → 36 routes rebuilt in 1.8 s · −${km} km`, ...l].slice(0, 4));
      setBusy(false);
    }, 900);
  };
  const sources = ["Email", "WhatsApp", "PDF", "Phone call", "EDI"];
  return (
    <section id="fleet" data-cam="fleet" className="relative flex min-h-[150vh] items-center py-24">
      <Wrap className="flex justify-end">
        <div className="hud w-full max-w-[30rem] rounded-3xl p-6 md:p-8">
          <Kicker tone="text-flare">Fleet · night shift</Kicker>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] font-extrabold uppercase leading-[0.95]">
            <RiseWords text="Routes that *rebuild themselves.*" />
          </h2>
          <p className="mt-4 text-ink/70">Orders arrive any way customers send them. The intake agent turns them into bookings; the route planner re-plans every truck in seconds — time windows, capacity and driver hours kept.</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <span key={s} className="rounded-full border border-ink/15 px-3 py-1 font-mono text-[0.72rem] text-ink/75">
                {s} → booking
              </span>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-night/70 p-4">
              <p className="font-mono text-[0.66rem] uppercase text-ink/50">Trucks on the road</p>
              <p className="text-[1.8rem] font-extrabold">36</p>
            </div>
            <div className="rounded-2xl bg-night/70 p-4">
              <p className="font-mono text-[0.66rem] uppercase text-ink/50">Km saved today</p>
              <motion.p key={saved} initial={{ scale: 1.25, color: "#2ee6a6" }} animate={{ scale: 1, color: "#eef1fa" }} className="origin-left text-[1.8rem] font-extrabold">
                −{saved}
              </motion.p>
            </div>
          </div>
          <button onClick={drop} disabled={busy} className="mt-5 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-radar font-bold text-white transition-opacity disabled:opacity-60">
            <Plus size={18} /> {busy ? "Re-planning all trucks…" : "Drop in a 2 pm order"}
          </button>
          <ul className="mt-4 space-y-1.5">
            <AnimatePresence initial={false}>
              {log.map((l) => (
                <motion.li key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[0.74rem] text-ink/60">
                  {l}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </Wrap>
    </section>
  );
}

export function Tower() {
  const [active, setActive] = useState(0);
  const pick = (i: number) => {
    setActive(i);
    fire(WORLD_EVENT.agent, i);
  };
  const a = AGENTS[active]!;
  const Icon = AGENT_ICONS[a.icon] ?? Inbox;
  return (
    <section id="tower" data-cam="tower" className="relative flex min-h-[150vh] items-center py-24">
      <Wrap>
        <div className="hud max-w-[38rem] rounded-3xl p-6 md:p-8">
          <Kicker>Control tower · port</Kicker>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] font-extrabold uppercase leading-[0.95]">
            <RiseWords text="Nine agents. *One port.*" />
          </h2>
          <p className="mt-3 text-ink/70">Each agent owns one job across the port and the roads. Pick one — the tower locks on and shows what it did today.</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {AGENTS.map((ag, i) => {
              const I = AGENT_ICONS[ag.icon] ?? Inbox;
              return (
                <button
                  key={ag.name}
                  onMouseEnter={() => pick(i)}
                  onFocus={() => pick(i)}
                  onClick={() => pick(i)}
                  className={`flex min-h-[64px] cursor-pointer flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-colors ${i === active ? "border-flare bg-flare/15" : "border-ink/10 bg-night/60 hover:border-radar/60"}`}
                >
                  <I size={16} className={i === active ? "text-flare" : "text-radar-soft"} />
                  <span className="mt-1.5 text-[0.8rem] font-bold leading-tight">{ag.name}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mt-5 rounded-2xl bg-night/70 p-5">
              <p className="flex items-center gap-2 text-[1.15rem] font-bold">
                <Icon size={18} className="text-flare" /> {a.name}
              </p>
              <p className="mt-1 text-ink/70">{a.does}</p>
              <p className="mt-3 font-mono text-[0.78rem] text-ok">today › {a.today}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Wrap>
    </section>
  );
}

export function Storm() {
  const [state, setState] = useState<"risk" | "approved">("risk");
  const approve = () => {
    setState("approved");
    fire(WORLD_EVENT.reroute);
  };
  return (
    <section id="storm" data-cam="storm" className="relative flex min-h-[150vh] items-center py-24">
      <Wrap className="flex justify-end">
        <div className="hud w-full max-w-[30rem] rounded-3xl p-6 md:p-8">
          <Kicker tone="text-flare">Exception · live</Kicker>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] font-extrabold uppercase leading-[0.95]">
            <RiseWords text="Storm ahead. *Plan ready.*" />
          </h2>
          <div className="mt-6 rounded-2xl border border-flare/40 bg-flare/10 p-4">
            <p className="flex items-center gap-2 font-bold text-flare">
              <CloudLightning size={18} /> HX-2057 · Dhaka → Kolkata
            </p>
            <p className="mt-1.5 text-[0.92rem] text-ink/75">Cyclone rain has closed the N7 near Faridpur. Waiting it out misses the customer&apos;s 18:40 slot.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[0.88rem]">
            <div className="rounded-2xl bg-night/70 p-4">
              <p className="font-mono text-[0.66rem] uppercase text-ink/50">Wait</p>
              <p className="mt-1 font-bold">+4 h 10 m</p>
              <p className="text-ink/55">misses slot</p>
            </div>
            <div className="rounded-2xl border border-radar/50 bg-radar/15 p-4">
              <p className="font-mono text-[0.66rem] uppercase text-radar-soft">Detour · proposed</p>
              <p className="mt-1 font-bold">+18 km · +$14</p>
              <p className="text-ink/55">arrives 18:25</p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {state === "risk" ? (
              <motion.button key="b" exit={{ opacity: 0 }} onClick={approve} className="mt-5 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-radar font-bold text-white">
                <ShieldCheck size={18} /> Approve detour
              </motion.button>
            ) : (
              <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-ok/40 bg-ok/10 p-4 text-[0.9rem]">
                <p className="flex items-center gap-2 font-bold text-ok">
                  <Check size={16} /> Approved by you · driver rerouted
                </p>
                <p className="mt-1.5 text-ink/70">WhatsApp to Rahman Textiles: “Heavy rain on the N7 — we&apos;ve taken a detour, your delivery is still on for 18:25.”</p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-3 font-mono text-[0.7rem] text-ink/45">The agent prepared it. A person approved it. Logged.</p>
        </div>
      </Wrap>
    </section>
  );
}

const TONE: Record<string, string> = { low: "bg-ok/15 text-ok", medium: "bg-radar/20 text-radar-soft", high: "bg-flare/15 text-flare" };
const QUOTES = [
  ["Air express", "$1,840", "2 days", "1.9 t", true],
  ["Sea-air", "$1,120", "6 days", "0.7 t", false],
  ["Ocean LCL", "$640", "14 days", "0.2 t", false],
] as const;

export function Desk() {
  const [tab, setTab] = useState<"ship" | "quote" | "inbox">("ship");
  return (
    <section id="desk" data-cam="map" className="relative py-32">
      <Wrap>
        <div className="max-w-[40rem]">
          <Kicker>The ops desk</Kicker>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-extrabold uppercase leading-[0.92]">
            <RiseWords text="Your whole map, *one screen.*" />
          </h2>
        </div>
        <Rise delay={0.1}>
          <div className="hud mt-10 overflow-hidden rounded-3xl">
            <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 px-5 py-3">
              {(
                [
                  ["ship", "Shipments"],
                  ["quote", "Quotes"],
                  ["inbox", "Inbox"],
                ] as const
              ).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`min-h-[36px] cursor-pointer rounded-full px-4 text-[0.85rem] font-bold ${tab === k ? "bg-radar text-white" : "text-ink/60 hover:text-ink"}`}>
                  {label}
                </button>
              ))}
              <span className="ml-auto font-mono text-[0.7rem] text-ink/40">demo data</span>
            </div>
            <div className="min-h-[22rem] p-5">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {tab === "ship" && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[540px] text-left text-[0.92rem]">
                        <thead className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/45">
                          <tr>
                            {["ID", "Lane", "Mode", "Status", "ETA"].map((h) => (
                              <th key={h} className="pb-3 font-normal">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SHIPMENTS.map((s) => (
                            <tr key={s.id} onClick={() => openAssistant("chat", `Track ${s.id}`)} className="cursor-pointer border-t border-ink/8 hover:bg-ink/[0.04]">
                              <td className="py-3 font-mono text-radar-soft">{s.id}</td>
                              <td className="py-3">{s.lane}</td>
                              <td className="py-3 text-ink/60">{s.mode}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold ${TONE[s.risk]}`}>{s.status}</span>
                              </td>
                              <td className="py-3 font-mono text-[0.84rem] text-ink/70">{s.eta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 font-mono text-[0.72rem] text-ink/40">Tap a row to ask the agent about it.</p>
                    </div>
                  )}
                  {tab === "quote" && (
                    <div>
                      <p className="font-mono text-[0.78rem] text-ink/55">Quoting agent · Dhaka → Singapore · 300 kg</p>
                      <div className="mt-3 space-y-2">
                        {QUOTES.map(([n, p, d, c, best]) => (
                          <div key={n} className={`grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center rounded-2xl px-4 py-3.5 ${best ? "bg-radar text-white" : "bg-night/60"}`}>
                            <span className="font-bold">{n}</span>
                            <span className="font-mono">{p}</span>
                            <span className="font-mono">{d}</span>
                            <span className="font-mono">{c} CO₂</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => openAssistant("chat", "Quote Dhaka to Singapore, 300 kg")} className="mt-4 min-h-[44px] cursor-pointer rounded-full border border-ink/20 px-5 text-[0.88rem] font-bold hover:bg-ink/5">
                        Ask for your own quote →
                      </button>
                    </div>
                  )}
                  {tab === "inbox" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-night/60 p-4 font-mono text-[0.82rem] leading-relaxed text-ink/75">
                        <p className="text-ink/45">From: ops@rahmantextiles.com</p>
                        <p className="mt-2">“Hi, need 12 cartons (300kg) picked up tomorrow morning from our Tejgaon factory to Kolkata DC. Invoice attached.”</p>
                        <p className="mt-3 text-flare">▼ parsed in 38 s</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[0.86rem]">
                        {[
                          ["Shipper", "Rahman Textiles"],
                          ["Pickup", "Tejgaon · tomorrow 10–12"],
                          ["Deliver to", "Kolkata DC"],
                          ["Cargo", "12 cartons · 300 kg"],
                          ["Docs", "Invoice ✓ · packing list missing"],
                          ["Next", "Asked for packing list"],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-night/60 px-3 py-2">
                            <p className="font-mono text-[0.64rem] uppercase text-ink/45">{k}</p>
                            <p className="font-semibold">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Rise>
      </Wrap>
    </section>
  );
}

export function Rules() {
  return (
    <section id="rules" data-cam="end" className="relative py-32">
      <Wrap>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Kicker tone="text-flare">Rules of the road</Kicker>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-extrabold uppercase leading-[0.92]">
              <RiseWords text="Autonomous, *never unsupervised.*" />
            </h2>
            <p className="mt-5 max-w-[30rem] text-ink/70">The same rule as Nofa, our clinic receptionist: agents do the legwork, a person makes the call when money or promises are involved.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <span key={c} className="hud rounded-full px-3.5 py-1.5 text-[0.86rem]">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GUARDRAILS.map((g, i) => (
              <Rise key={g.rule} delay={i * 0.08}>
                <div className="hud h-full rounded-2xl p-6">
                  <ShieldCheck className="text-radar-soft" size={22} />
                  <h3 className="mt-4 text-[1.12rem] font-bold">{g.rule}</h3>
                  <p className="mt-2 text-[0.94rem] text-ink/65">{g.detail}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
        <div className="mt-28 text-center">
          <h2 className="mx-auto max-w-[54rem] text-[clamp(2.6rem,7vw,6rem)] font-extrabold uppercase leading-[0.9]">
            <RiseWords text="Hand the night shift *to the agents.*" />
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={() => openAssistant("voice")} className="min-h-[52px] cursor-pointer rounded-full bg-flare px-7 font-bold text-white shadow-[0_0_40px_-8px_#ff3b5c]">
              Talk to Haulix
            </button>
            <a href={`mailto:${SITE.email}?subject=Haulix`} className="flex min-h-[52px] items-center rounded-full border border-ink/25 px-7 font-bold hover:bg-ink/5">
              Book a walkthrough
            </a>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-night/80 py-10 backdrop-blur">
      <Wrap className="flex flex-col items-center justify-between gap-3 text-[0.88rem] text-ink/55 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE.name} · built by{" "}
          <a href={SITE.by.url} className="text-ink/85 underline-offset-4 hover:underline">
            {SITE.by.name}
          </a>
        </p>
        <p className="font-mono text-[0.76rem]">Demo · sample data · footage: Mixkit (free licence)</p>
      </Wrap>
    </footer>
  );
}
