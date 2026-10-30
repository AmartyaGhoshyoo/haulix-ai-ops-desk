"use client";

// Floating chat + voice assistant. Colours come from the site's --w-* CSS variables; the
// answers come from the site's brain (demo) or the agent backend (live). Cards that would
// change something (a reroute, an order) wait for the visitor's tap.
import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Footprints,
  Glasses,
  Headphones,
  Laptop,
  Mic,
  MicOff,
  Package,
  Send,
  Shirt,
  ShoppingBag,
  Sparkles,
  Watch,
  X,
  type LucideIcon,
} from "lucide-react";
import { AGENT_LIVE, ask } from "./client";
import type { Brain, Card, Message, Reply } from "./types";

const ease = [0.22, 1, 0.36, 1] as const;
export const OPEN_EVENT = "agent:open";

/** Open the assistant from anywhere: openAssistant("chat" | "voice", "first message?") */
export function openAssistant(mode: "chat" | "voice" = "chat", prompt?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { mode, prompt } }));
}

export const ICONS: Record<string, LucideIcon> = {
  headphones: Headphones,
  watch: Watch,
  shoe: Footprints,
  shirt: Shirt,
  glasses: Glasses,
  laptop: Laptop,
  bag: ShoppingBag,
  package: Package,
};

let seq = 0;
const nextId = () => `m${++seq}`;

export default function Assistant({ brain }: { brain: Brain }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [prompt, setPrompt] = useState<string | undefined>();

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ mode: "chat" | "voice"; prompt?: string }>).detail;
      setMode(d?.mode ?? "chat");
      setPrompt(d?.prompt);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <div className="assistant-root font-[family-name:var(--w-font)]">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`${brain.name} assistant`}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease }}
            style={{ transformOrigin: "bottom right" }}
            data-lenis-prevent
            className="fixed inset-x-3 bottom-[5.5rem] z-[90] flex h-[min(640px,calc(100dvh-7.5rem))] flex-col overflow-hidden rounded-[1.6rem] border border-[var(--w-line)] bg-[var(--w-bg)] text-[var(--w-ink)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:right-5 sm:w-[410px]"
          >
            <header className="flex items-center gap-3 border-b border-[var(--w-line)] px-4 py-3">
              <Orb size={36} active={false} />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">{brain.name}</p>
                <p className="text-[0.76rem] text-[var(--w-muted)]">{AGENT_LIVE ? "AI agent · live" : "AI agent · demo mode"}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--w-surface)]">
                <X size={18} />
              </button>
            </header>
            <div role="tablist" className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-full bg-[var(--w-surface)] p-1">
              {(["chat", "voice"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`min-h-[36px] cursor-pointer rounded-full text-[0.88rem] font-semibold capitalize transition-colors ${
                    mode === m ? "bg-[var(--w-accent)] text-[var(--w-on-accent)]" : "text-[var(--w-muted)]"
                  }`}
                >
                  {m === "chat" ? "Chat" : "Voice"}
                </button>
              ))}
            </div>
            <div className="relative min-h-0 flex-1">{mode === "chat" ? <Chat brain={brain} prompt={prompt} onPromptUsed={() => setPrompt(undefined)} /> : <Voice brain={brain} />}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : `Talk to ${brain.name}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease }}
        whileHover={{ y: -2 }}
        className="fixed bottom-5 right-5 z-[90] flex h-[54px] cursor-pointer items-center gap-2.5 rounded-full bg-[var(--w-accent)] pl-1.5 pr-5 font-bold text-[var(--w-on-accent)] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)]"
      >
        {open ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
            <X size={18} />
          </span>
        ) : (
          <Orb size={40} active />
        )}
        {open ? "Close" : `Ask ${brain.name}`}
      </motion.button>
    </div>
  );
}

function Orb({ size, active }: { size: number; active: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle at 35% 30%, var(--w-orb-a), var(--w-orb-b) 70%)" }}
        animate={active ? { scale: [1, 1.07, 1] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <span className="absolute inset-[18%] rounded-full bg-white/25 blur-[2px]" />
    </span>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────

function Chat({ brain, prompt, onPromptUsed }: { brain: Brain; prompt?: string; onPromptUsed: () => void }) {
  const [messages, setMessages] = useState<Message[]>(() => [{ id: nextId(), role: "agent", ...brain.greeting }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const conv = useRef("");
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || thinking) return;
      const history = [...messages, { id: nextId(), role: "user" as const, text: t }];
      setMessages(history);
      setInput("");
      setThinking(true);
      conv.current ||= `web-${Math.random().toString(36).slice(2)}`;
      const reply = await ask(brain, t, history, conv.current);
      setThinking(false);
      // Write the reply out word by word.
      const id = nextId();
      const words = reply.text.split(/(\s+)/);
      setMessages((m) => [...m, { id, role: "agent", text: "" }]);
      for (let i = 2; i <= words.length + 1; i += 2) {
        await new Promise((r) => setTimeout(r, 22));
        setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: words.slice(0, i).join("") } : x)));
      }
      setMessages((m) => m.map((x) => (x.id === id ? { id, role: "agent", ...reply } : x)));
    },
    [brain, messages, thinking]
  );

  const sent = useRef(false);
  useEffect(() => {
    if (prompt && !sent.current) {
      sent.current = true;
      send(prompt);
      onPromptUsed();
    }
  }, [prompt, send, onPromptUsed]);

  const last = messages[messages.length - 1];
  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={list} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-[1.1rem] px-3.5 py-2.5 text-[0.93rem] leading-relaxed ${
                m.role === "user" ? "rounded-br-md bg-[var(--w-accent)] text-[var(--w-on-accent)]" : "rounded-bl-md bg-[var(--w-surface)]"
              }`}
            >
              {m.text}
            </div>
            {m.cards?.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="mt-2">
                <CardView card={c} />
              </motion.div>
            ))}
          </div>
        ))}
        {thinking && (
          <div className="inline-flex gap-1 rounded-[1.1rem] rounded-bl-md bg-[var(--w-surface)] px-4 py-3.5" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--w-muted)]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        {last?.role === "agent" && last.quick && !thinking && (
          <div className="flex flex-wrap gap-2">
            {last.quick.map((q) => (
              <button key={q} onClick={() => send(q)} className="min-h-[38px] cursor-pointer rounded-full border border-[var(--w-accent)]/40 px-3.5 text-[0.84rem] font-semibold text-[var(--w-accent-ink)] hover:bg-[var(--w-surface)]">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-[var(--w-line)] p-3"
      >
        <div className="flex items-center gap-2 rounded-full border border-[var(--w-line)] bg-[var(--w-surface)] py-1.5 pl-4 pr-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            aria-label="Message"
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-[var(--w-muted)]"
          />
          <button disabled={!input.trim() || thinking} aria-label="Send" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--w-accent)] text-[var(--w-on-accent)] disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────

function Shell({ title, children, tone = "accent" }: { title: string; children: ReactNode; tone?: "accent" | "ok" | "warn" }) {
  const head = tone === "ok" ? "bg-[var(--w-ok)]/15 text-[var(--w-ok)]" : tone === "warn" ? "bg-[var(--w-warn)]/15 text-[var(--w-warn)]" : "bg-[var(--w-accent)]/15 text-[var(--w-accent-ink)]";
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--w-line)] bg-[var(--w-bg)]">
      <p className={`px-3.5 py-2 text-[0.76rem] font-bold uppercase tracking-wider ${head}`}>{title}</p>
      <div className="px-3.5 py-3 text-[0.88rem]">{children}</div>
    </div>
  );
}

function CardView({ card }: { card: Card }) {
  const [done, setDone] = useState(false);
  switch (card.kind) {
    case "shipment":
      return (
        <Shell title={`Shipment ${card.id} · ${card.status}`} tone={card.risk ? "warn" : "accent"}>
          <p className="font-bold">
            {card.from} → {card.to}
          </p>
          <p className="text-[var(--w-muted)]">ETA {card.eta}</p>
          {card.risk && <p className="mt-1 text-[var(--w-warn)]">{card.risk}</p>}
          <ol className="mt-2 space-y-1">
            {card.steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${s.done ? "bg-[var(--w-ok)] text-white" : "border border-[var(--w-line)]"}`}>
                  {s.done && <Check size={10} />}
                </span>
                <span className={s.done ? "" : "text-[var(--w-muted)]"}>{s.label}</span>
                {s.when && <span className="ml-auto text-[0.76rem] text-[var(--w-muted)]">{s.when}</span>}
              </li>
            ))}
          </ol>
        </Shell>
      );
    case "quote":
      return (
        <Shell title={`Quote · ${card.lane}`}>
          <div className="space-y-1.5">
            {card.options.map((o) => (
              <div key={o.name} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${o.best ? "bg-[var(--w-accent)]/12 ring-1 ring-[var(--w-accent)]/40" : "bg-[var(--w-surface)]"}`}>
                <span className="flex-1 font-semibold">
                  {o.name} {o.best && <span className="ml-1 text-[0.7rem] text-[var(--w-accent-ink)]">BEST</span>}
                </span>
                <span className="text-[0.8rem] text-[var(--w-muted)]">
                  {o.days} · {o.co2}
                </span>
                <span className="font-bold">{o.price}</span>
              </div>
            ))}
          </div>
        </Shell>
      );
    case "products":
      return (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {card.items.map((p) => {
            const Icon = ICONS[p.icon] ?? Package;
            return (
              <div key={p.id} className="w-[9.5rem] shrink-0 overflow-hidden rounded-2xl border border-[var(--w-line)] bg-[var(--w-bg)]">
                <div className="flex h-24 items-center justify-center" style={{ background: p.tone }}>
                  <Icon size={40} strokeWidth={1.4} className="text-white drop-shadow" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[0.84rem] font-bold">{p.name}</p>
                  <p className="text-[0.78rem] text-[var(--w-muted)]">{p.note}</p>
                  <p className="mt-1 font-bold">{p.price}</p>
                </div>
              </div>
            );
          })}
        </div>
      );
    case "compare":
      return (
        <Shell title="Side by side">
          <table className="w-full text-left text-[0.84rem]">
            <thead>
              <tr className="text-[var(--w-muted)]">
                <th className="pb-1 font-medium" />
                <th className="pb-1 font-semibold">{card.a}</th>
                <th className="pb-1 font-semibold">{card.b}</th>
              </tr>
            </thead>
            <tbody>
              {card.rows.map((r) => (
                <tr key={r.label} className="border-t border-[var(--w-line)]">
                  <td className="py-1.5 text-[var(--w-muted)]">{r.label}</td>
                  <td className="py-1.5">{r.a}</td>
                  <td className="py-1.5">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Shell>
      );
    case "cart":
      return (
        <Shell title="Your cart">
          {card.lines.map((l) => (
            <p key={l.name} className="flex justify-between py-0.5">
              <span>
                {l.qty} × {l.name}
              </span>
              <span>{l.price}</span>
            </p>
          ))}
          <p className="mt-2 flex justify-between border-t border-[var(--w-line)] pt-2 font-bold">
            <span>Total</span>
            <span>{card.total}</span>
          </p>
        </Shell>
      );
    case "proposal":
      return (
        <Shell title={done ? "Done · confirmed by you" : "Needs your OK"} tone={done ? "ok" : "accent"}>
          <p className="font-bold">{card.title}</p>
          <p className="mt-0.5 text-[var(--w-muted)]">{done ? card.done : card.detail}</p>
          {!done && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setDone(true)} className="min-h-[40px] cursor-pointer rounded-xl bg-[var(--w-accent)] px-3.5 font-bold text-[var(--w-on-accent)]">
                {card.confirm}
              </button>
              <span className="self-center text-[0.78rem] text-[var(--w-muted)]">Nothing happens until you tap.</span>
            </div>
          )}
        </Shell>
      );
  }
}

// ── Voice (browser speech in demo mode) ──────────────────────────────────────

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function Voice({ brain }: { brain: Brain }) {
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [lines, setLines] = useState<{ who: "you" | "agent"; text: string }[]>([]);
  const [heard, setHeard] = useState("");
  const [supported, setSupported] = useState(true);
  const rec = useRef<SpeechRec | null>(null);
  const history = useRef<Message[]>([]);

  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only capability check
    if (!Ctor) setSupported(false);
    return () => {
      rec.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) =>
    new Promise<void>((done) => {
      if (!window.speechSynthesis) return done();
      const u = new SpeechSynthesisUtterance(text.replace(/[→·]/g, " "));
      u.rate = 1.03;
      u.onend = () => done();
      u.onerror = () => done();
      window.speechSynthesis.speak(u);
    });

  const handle = async (text: string) => {
    setLines((l) => [...l, { who: "you", text }]);
    history.current.push({ id: nextId(), role: "user", text });
    setState("thinking");
    const reply: Reply = await ask(brain, text, history.current, "voice");
    history.current.push({ id: nextId(), role: "agent", ...reply });
    setLines((l) => [...l, { who: "agent", text: reply.text }]);
    setState("speaking");
    await speak(reply.text);
    setState("idle");
  };

  const listen = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    window.speechSynthesis?.cancel();
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      const res = Array.from(e.results);
      final = res.map((x) => x[0]?.transcript ?? "").join(" ");
      setHeard(final);
    };
    r.onend = () => {
      setHeard("");
      if (final.trim()) handle(final.trim());
      else setState("idle");
    };
    r.onerror = () => setState("idle");
    rec.current = r;
    setState("listening");
    r.start();
  };

  const label = { idle: "Tap the mic and speak", listening: "Listening…", thinking: "Thinking…", speaking: `${brain.name} is speaking` }[state];

  return (
    <div className="absolute inset-0 flex flex-col items-center px-5 pb-5 pt-6">
      <motion.div
        animate={state === "listening" || state === "speaking" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: state === "speaking" ? 0.6 : 1.4, repeat: Infinity }}
      >
        <Orb size={state === "idle" && lines.length === 0 ? 120 : 76} active={state !== "idle"} />
      </motion.div>
      <p className="mt-3 text-[0.9rem] font-semibold text-[var(--w-muted)]" role="status">
        {label}
      </p>
      {heard && <p className="mt-1 text-center text-[0.9rem] italic">“{heard}”</p>}
      <div className="mt-4 min-h-0 w-full flex-1 space-y-2 overflow-y-auto">
        {lines.length === 0 && (
          <p className="px-2 text-center text-[0.88rem] leading-relaxed text-[var(--w-muted)]">
            {supported ? brain.voiceHint : "Voice input needs Chrome, Edge or Safari. You can still hear a demo answer below."}
          </p>
        )}
        {lines.map((l, i) => (
          <p key={i} className={`max-w-[88%] rounded-2xl px-3 py-2 text-[0.88rem] ${l.who === "you" ? "ml-auto bg-[var(--w-accent)] text-[var(--w-on-accent)]" : "bg-[var(--w-surface)]"}`}>
            {l.text}
          </p>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        {supported ? (
          <button
            onClick={() => (state === "listening" ? rec.current?.stop() : listen())}
            disabled={state === "thinking" || state === "speaking"}
            className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[var(--w-accent)] px-6 font-bold text-[var(--w-on-accent)] disabled:opacity-50"
          >
            {state === "listening" ? <MicOff size={18} /> : <Mic size={18} />}
            {state === "listening" ? "Stop" : "Speak"}
          </button>
        ) : (
          <button onClick={() => handle(brain.greeting.quick?.[0] ?? "Hello")} className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[var(--w-accent)] px-6 font-bold text-[var(--w-on-accent)]">
            <Sparkles size={18} /> Hear a demo
          </button>
        )}
      </div>
    </div>
  );
}
