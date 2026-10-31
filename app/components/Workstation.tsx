"use client";

// The agentic workstation: what an ops lead sees at 2 a.m. Four views of one live desk —
// Live desk (orders become bookings; exceptions wait for a person), Routes (a 2 pm order
// re-plans the run), Exceptions (approve / decline with cost and ETA) and Ops board.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, FileText, Inbox, LayoutGrid, Mail, MessageSquare, Phone, Plus, Route, ShieldCheck, Sparkles, TriangleAlert, Truck, X, type LucideIcon } from "lucide-react";
import { SHIPMENTS } from "../data/site";

const ease = [0.22, 1, 0.36, 1] as const;

// ── Live intake: raw messages the intake agent turns into bookings ──────────
const ORDERS: { src: "email" | "whatsapp" | "pdf" | "call"; from: string; raw: string; lane: string; load: string; window: string; missing?: string }[] = [
  { src: "email", from: "Rahman Textiles", raw: "Need 2 pallets of denim to Chittagong port, pickup tomorrow morning pls", lane: "Gazipur → Chittagong", load: "2 pallets · 640 kg", window: "Tue 08:00–11:00" },
  { src: "whatsapp", from: "Nadia (Meridian Foods)", raw: "can u collect 14 cartons from our dhanmondi store today?", lane: "Dhanmondi → Tejgaon DC", load: "14 cartons · 210 kg", window: "Today 16:00–18:00" },
  { src: "pdf", from: "Kestrel Lines · booking.pdf", raw: "40ft HC, Chattogram → Rotterdam, cargo ready 4 Nov", lane: "Chattogram → Rotterdam", load: "1 × 40ft HC", window: "Ready Nov 4" },
  { src: "call", from: "Voice · +880 17•• ••• 214", raw: "“Two machines to Sylhet, fragile, before Friday.”", lane: "Narayanganj → Sylhet", load: "2 crates · fragile", window: "By Fri", missing: "crate size" },
  { src: "email", from: "Orbit Pharma", raw: "Cold chain: 6 boxes vaccines to Khulna, 2–8 °C, urgent", lane: "Savar → Khulna", load: "6 boxes · 2–8 °C", window: "Today 20:00" },
  { src: "whatsapp", from: "Hasan Electronics", raw: "return 3 TVs from customer in Uttara, they said damaged", lane: "Uttara → Returns hub", load: "3 TVs · return", window: "Tomorrow AM" },
];
const SRC: Record<string, { icon: LucideIcon; label: string }> = {
  email: { icon: Mail, label: "Email" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp" },
  pdf: { icon: FileText, label: "PDF" },
  call: { icon: Phone, label: "Phone" },
};

type Exc = { id: string; ship: string; title: string; why: string; plan: string; cost: string; eta: string };
const EXCEPTIONS: Exc[] = [
  { id: "e1", ship: "HX-2041", title: "Cyclone warning · Bay of Bengal", why: "Feeder from Chattogram likely held 30 h", plan: "Reroute via Colombo on MSC Aurora", cost: "+$140", eta: "Nov 18 (−9 h vs waiting)" },
  { id: "e2", ship: "HX-2063", title: "Customs hold · Dhaka airport", why: "HS code 8517 on invoice, 8471 on packing list", plan: "Correct invoice to 8471.30, resubmit", cost: "$0", eta: "Clears in ~4 h" },
  { id: "e3", ship: "WH-A14", title: "Low stock · Carton A-14", why: "2 days of cover left at current picks", plan: "Reorder 400 cartons from Pack&Go", cost: "$2,480", eta: "Delivered Thu" },
  { id: "e4", ship: "HX-2070", title: "Truck breakdown · N1 Comilla", why: "Driver reported engine fault 40 min ago", plan: "Swap to truck DH-12 (12 km away)", cost: "+$65", eta: "−25 min delay" },
];

// ── Route planner: depot + stops on a stylised city grid ─────────────────────
type P = { x: number; y: number; name: string };
const DEPOT: P = { x: 70, y: 250, name: "Tejgaon DC" };
const STOPS: P[] = [
  { x: 160, y: 120, name: "Mirpur" }, { x: 250, y: 70, name: "Uttara" }, { x: 360, y: 110, name: "Baridhara" }, { x: 430, y: 200, name: "Badda" },
  { x: 400, y: 300, name: "Motijheel" }, { x: 300, y: 340, name: "Dhanmondi" }, { x: 190, y: 330, name: "Mohammadpur" },
];
const EXTRA: P = { x: 330, y: 220, name: "Gulshan · 2 pm order" };
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
function plan(stops: P[]) {
  // Nearest-neighbour then 2-opt: good enough to show the idea, instantly.
  const left = [...stops];
  const order: P[] = [DEPOT];
  while (left.length) {
    const cur = order[order.length - 1]!;
    left.sort((a, b) => dist(cur, a) - dist(cur, b));
    order.push(left.shift()!);
  }
  order.push(DEPOT);
  let better = true;
  while (better) {
    better = false;
    for (let i = 1; i < order.length - 2; i++)
      for (let j = i + 1; j < order.length - 1; j++) {
        const d = dist(order[i - 1]!, order[i]!) + dist(order[j]!, order[j + 1]!) - dist(order[i - 1]!, order[j]!) - dist(order[i]!, order[j + 1]!);
        if (d > 0.01) {
          order.splice(i, j - i + 1, ...order.slice(i, j + 1).reverse());
          better = true;
        }
      }
  }
  const km = order.slice(1).reduce((s, p, i) => s + dist(order[i]!, p), 0) * 0.055;
  return { order, km };
}

const TABS: { key: "desk" | "routes" | "exceptions" | "board"; label: string; icon: LucideIcon }[] = [
  { key: "desk", label: "Live desk", icon: Inbox },
  { key: "routes", label: "Routes", icon: Route },
  { key: "exceptions", label: "Exceptions", icon: TriangleAlert },
  { key: "board", label: "Ops board", icon: LayoutGrid },
];

type TabKey = (typeof TABS)[number]["key"];
export const STAGES = TABS.map((t) => t.label);

/** `stage` (0–3) and `sub` (0–1 within it) come from the page scroll on wide screens; otherwise tabs. */
export default function Workstation({ stage, sub = 0, onStage }: { stage?: number; sub?: number; onStage?(i: number): void }) {
  const [own, setOwn] = useState<TabKey>("desk");
  const tab: TabKey = stage !== undefined ? TABS[stage]!.key : own;
  const setTab = (k: TabKey) => {
    const i = TABS.findIndex((t) => t.key === k);
    if (onStage) onStage(i);
    else setOwn(k);
  };
  const [feed, setFeed] = useState<{ n: number; o: (typeof ORDERS)[number]; done: boolean }[]>([]);
  const [decided, setDecided] = useState<Record<string, "ok" | "no">>({});
  const [manual, setManual] = useState<boolean | null>(null);
  const [booked, setBooked] = useState(148);
  const nextId = useRef(0);

  // A new message lands every ~2.6 s; the intake agent turns it into a booking 1.4 s later.
  useEffect(() => {
    const push = () => {
      const id = nextId.current++;
      const o = ORDERS[id % ORDERS.length]!;
      setFeed((f) => [{ n: id, o, done: false }, ...f].slice(0, 5));
      setTimeout(() => {
        setFeed((f) => f.map((x) => (x.n === id ? { ...x, done: true } : x)));
        if (!o.missing) setBooked((b) => b + 1);
      }, 1400);
    };
    push();
    const t = setInterval(push, 2600);
    return () => clearInterval(t);
  }, []);

  // Scrolling through the Routes stage drops in the 2 pm order by itself halfway through,
  // unless the visitor has pressed the button themselves.
  const added = manual ?? (stage === 1 && sub > 0.45);

  const open = EXCEPTIONS.filter((e) => !decided[e.id]);
  const decide = (id: string, v: "ok" | "no") => setDecided((d) => ({ ...d, [id]: v }));
  const route = useMemo(() => plan(added ? [...STOPS, EXTRA] : STOPS), [added]);
  const before = useMemo(() => plan(STOPS).km, []);

  return (
    <div className="ws relative overflow-hidden rounded-[22px]">
      {/* Window chrome */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-radar/20 text-radar-soft">
            <Sparkles size={15} />
          </span>
          <div>
            <p className="text-[0.88rem] font-semibold leading-tight">Haulix Workstation</p>
            <p className="font-mono text-[0.68rem] text-ink/45">Night shift · 9 agents online</p>
          </div>
        </div>
        <div className="flex gap-4 font-mono text-[0.72rem]">
          <Kpi label="Bookings today" value={String(booked)} />
          <Kpi label="On time" value="97.4%" />
          <Kpi label="Needs you" value={String(open.length)} warn={open.length > 0} />
        </div>
      </div>

      <div className="grid md:grid-cols-[190px_1fr]">
        {/* Sidebar */}
        <nav className="flex gap-1 overflow-x-auto border-b border-white/[0.07] p-2 md:flex-col md:border-b-0 md:border-r [scrollbar-width:none]" aria-label="Workstation views">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex min-h-[40px] shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-[0.86rem] transition-colors ${tab === t.key ? "bg-white/[0.08] text-ink" : "text-ink/55 hover:bg-white/[0.04] hover:text-ink"}`}
            >
              <t.icon size={16} className={tab === t.key ? "text-radar-soft" : ""} />
              {t.label}
              {t.key === "exceptions" && open.length > 0 && <span className="ml-auto rounded-full bg-flare/20 px-1.5 font-mono text-[0.68rem] text-flare">{open.length}</span>}
            </button>
          ))}
          <div className="mt-auto hidden rounded-xl bg-white/[0.03] p-3 md:block">
            <p className="flex items-center gap-1.5 text-[0.72rem] text-ok">
              <ShieldCheck size={13} /> Guardrails on
            </p>
            <p className="mt-1 text-[0.7rem] leading-snug text-ink/45">Auto-book under $500. Everything else waits for a person.</p>
          </div>
        </nav>

        {/* Views */}
        <div className="h-[470px] overflow-y-auto p-3 [scrollbar-width:thin] sm:p-4" data-lenis-prevent>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease }}>
              {tab === "desk" && (
                <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
                  <Panel title="Intake → bookings" note="live">
                    <ul className="h-[372px] space-y-2 overflow-hidden [mask-image:linear-gradient(180deg,#000_85%,transparent)]">
                      <AnimatePresence initial={false} mode="popLayout">
                        {feed.map(({ n, o, done }) => {
                          const S = SRC[o.src]!;
                          return (
                            <motion.li key={n} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                              <div className="flex items-center gap-2 text-[0.72rem] text-ink/50">
                                <S.icon size={13} /> {S.label} · {o.from}
                              </div>
                              <p className="mt-1 text-[0.85rem] text-ink/80">{o.raw}</p>
                              <AnimatePresence>
                                {done && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.72rem]">
                                      <span className={`rounded-md px-1.5 py-0.5 font-medium ${o.missing ? "bg-amber-400/15 text-amber-300" : "bg-ok/15 text-ok"}`}>{o.missing ? `Asked for ${o.missing}` : `Booking HX-${2100 + n} drafted`}</span>
                                      <Chip>{o.lane}</Chip>
                                      <Chip>{o.load}</Chip>
                                      <Chip>{o.window}</Chip>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </Panel>
                  <Panel title="Waiting for you" note={`${open.length} open`}>
                    <div className="h-[372px] overflow-hidden">
                    <ExceptionList items={open.slice(0, 2)} decide={decide} compact />
                    {open.length === 0 && <AllClear />}
                    {open.length > 2 && (
                      <button onClick={() => setTab("exceptions")} className="mt-2 w-full cursor-pointer rounded-xl py-2 text-[0.8rem] text-radar-soft hover:bg-white/[0.04]">
                        See all {open.length} →
                      </button>
                    )}
                    </div>
                  </Panel>
                </div>
              )}

              {tab === "routes" && (
                <Panel title="Route planner · Truck DH-07 · 8 stops" note={`${route.km.toFixed(1)} km`}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                    <svg viewBox="0 0 500 400" className="w-full rounded-xl bg-[#060a16]" role="img" aria-label="Route map">
                      {/* City grid */}
                      {Array.from({ length: 11 }, (_, i) => (
                        <g key={i} stroke="rgba(110,149,255,0.08)">
                          <line x1={i * 50} y1={0} x2={i * 50} y2={400} />
                          <line x1={0} y1={i * 40} x2={500} y2={i * 40} />
                        </g>
                      ))}
                      <path d="M0 210 C 120 190, 200 260, 500 230" stroke="rgba(110,149,255,0.18)" strokeWidth="10" fill="none" />
                      <motion.polyline
                        key={added ? "b" : "a"}
                        points={route.order.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#2f6bff"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, ease }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(47,107,255,0.8))" }}
                      />
                      {(added ? [...STOPS, EXTRA] : STOPS).map((s) => (
                        <g key={s.name}>
                          <circle cx={s.x} cy={s.y} r={s === EXTRA ? 9 : 7} fill={s === EXTRA ? "#ff3b5c" : "#0a0d1a"} stroke={s === EXTRA ? "#ff3b5c" : "#6e95ff"} strokeWidth="2.5" />
                          <text x={s.x + 12} y={s.y + 4} fill="rgba(238,241,250,0.7)" fontSize="12" fontFamily="var(--font-mono-face)">
                            {s.name}
                          </text>
                        </g>
                      ))}
                      <rect x={DEPOT.x - 9} y={DEPOT.y - 9} width="18" height="18" rx="4" fill="#2ee6a6" />
                      <text x={DEPOT.x - 20} y={DEPOT.y + 28} fill="#2ee6a6" fontSize="12" fontFamily="var(--font-mono-face)">
                        {DEPOT.name}
                      </text>
                    </svg>
                    <div className="space-y-2.5 text-[0.85rem]">
                      <Stat label="Distance" value={`${route.km.toFixed(1)} km`} />
                      <Stat label="Time windows" value="8 / 8 kept" />
                      <Stat label="Driver hours" value="6 h 40 m · legal" />
                      {added ? (
                        <p className="rounded-xl bg-ok/10 p-3 text-[0.8rem] text-ok">
                          Re-planned in 0.4 s. Gulshan fitted between Baridhara and Badda — only {(route.km - before).toFixed(1)} km added.
                        </p>
                      ) : (
                        <p className="rounded-xl bg-white/[0.04] p-3 text-[0.8rem] text-ink/60">A customer just called with a 2 pm pickup in Gulshan.</p>
                      )}
                      <button
                        onClick={() => setManual(!added)}
                        className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-radar text-[0.85rem] font-semibold text-white hover:bg-[#4a7dff]"
                      >
                        {added ? "Undo" : (
                          <>
                            <Plus size={15} /> Drop in the 2 pm order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Panel>
              )}

              {tab === "exceptions" && (
                <Panel title="Exceptions · agent proposals" note="you decide">
                  <ExceptionList items={EXCEPTIONS} decide={decide} decided={decided} />
                </Panel>
              )}

              {tab === "board" && (
                <Panel title="Ops board · all lanes" note="updated 12 s ago">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-[0.82rem]">
                      <thead className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink/40">
                        <tr>
                          <th className="py-2 font-normal">Shipment</th>
                          <th className="font-normal">Lane</th>
                          <th className="font-normal">Mode</th>
                          <th className="font-normal">Status</th>
                          <th className="font-normal">ETA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {SHIPMENTS.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2.5 font-mono text-radar-soft">{s.id}</td>
                            <td>{s.lane}</td>
                            <td className="text-ink/60">{s.mode}</td>
                            <td>
                              <span className={`rounded-md px-1.5 py-0.5 text-[0.72rem] ${s.risk === "high" ? "bg-flare/15 text-flare" : s.risk === "medium" ? "bg-amber-400/15 text-amber-300" : "bg-ok/15 text-ok"}`}>{s.status}</span>
                            </td>
                            <td className="font-mono text-ink/70">{s.eta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Trucks on road" value="36" />
                    <Stat label="At-risk caught" value="7" />
                    <Stat label="Avg quote time" value="38 s" />
                    <Stat label="WISMO handled" value="81%" />
                  </div>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ExceptionList({ items, decide, decided = {}, compact = false }: { items: Exc[]; decide(id: string, v: "ok" | "no"): void; decided?: Record<string, "ok" | "no">; compact?: boolean }) {
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((e) => {
          const d = decided[e.id];
          return (
            <motion.li key={e.id} layout exit={{ opacity: 0, x: 30 }} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-[0.86rem] font-semibold">
                    <TriangleAlert size={14} className="text-flare" /> {e.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.7rem] text-ink/45">
                    {e.ship} · {e.why}
                  </p>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-radar/10 p-2.5 text-[0.8rem]">
                <p className="flex items-center gap-1.5 text-radar-soft">
                  <Truck size={13} /> Proposal: {e.plan}
                </p>
                <p className="mt-1 flex gap-3 font-mono text-[0.7rem] text-ink/60">
                  <span>Cost {e.cost}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {e.eta}
                  </span>
                </p>
              </div>
              {d ? (
                <p className={`mt-2 text-[0.78rem] ${d === "ok" ? "text-ok" : "text-ink/50"}`}>{d === "ok" ? "Approved by you · agent is executing · logged" : "Declined · agent will look for another option"}</p>
              ) : (
                <div className={`mt-2 flex gap-2 ${compact ? "" : "justify-end"}`}>
                  <button onClick={() => decide(e.id, "ok")} className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg bg-ok px-3 text-[0.8rem] font-semibold text-[#04140d] hover:brightness-110">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => decide(e.id, "no")} className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[0.8rem] text-ink/70 hover:bg-white/[0.05]">
                    <X size={14} /> Decline
                  </button>
                </div>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function AllClear() {
  return (
    <div className="flex flex-col items-center rounded-xl bg-ok/[0.06] p-6 text-center">
      <Check className="text-ok" />
      <p className="mt-2 text-[0.88rem]">All clear. The agents are handling the rest.</p>
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#070b18]/60 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[0.86rem] font-semibold">{title}</h3>
        {note && (
          <span className="flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink/45">
            {note === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />}
            {note}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[0.62rem] uppercase tracking-[0.12em] text-ink/40">{label}</p>
      <p className={`text-[0.95rem] font-semibold ${warn ? "text-flare" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.12em] text-ink/40">{label}</p>
      <p className="mt-1 text-[1rem] font-semibold">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-ink/65">{children}</span>;
}
