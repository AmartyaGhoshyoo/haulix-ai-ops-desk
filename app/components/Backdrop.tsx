"use client";

// Real footage behind the middle of the page. While a section with data-cam="fleet|tower|storm|map"
// is on screen its clip fades in over the 3D world (which pauses while fully covered), with a
// live HUD drawn on top: route lines on the highway, a target box on the port for the chosen
// agent, the blocked road and detour in the storm, a radar sweep on the map.
// Footage: Mixkit free licence (mixkit.co/license).
import { useEffect, useRef, useState } from "react";
import { AGENTS } from "../data/site";
import { WORLD_EVENT } from "./World";

const CLIPS = [
  { key: "fleet", src: "/media/fleet.mp4", poster: "/media/fleet.jpg" },
  { key: "tower", src: "/media/port.mp4", poster: "/media/port.jpg" },
  { key: "storm", src: "/media/storm.mp4", poster: "/media/storm.jpg" },
  { key: "map", src: "/media/map.mp4", poster: "/media/map.jpg" },
] as const;
type ClipKey = (typeof CLIPS)[number]["key"];

const smooth = (t: number) => t * t * (3 - 2 * t);

// Highway routes for the fleet HUD: gentle curves across the frame, re-drawn on "replan".
function makeRoutes(seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 5 }, (_, i) => {
    const y0 = 120 + rnd() * 660, y1 = 120 + rnd() * 660;
    const c1 = 100 + rnd() * 700, c2 = 100 + rnd() * 700;
    return { d: `M -40 ${y0.toFixed(0)} C 500 ${c1.toFixed(0)}, 1100 ${c2.toFixed(0)}, 1640 ${y1.toFixed(0)}`, red: i % 3 === 0, dur: 5 + rnd() * 5 };
  });
}

const TOWER_SPOTS = [
  [62, 28], [74, 24], [86, 30], [60, 50], [73, 52], [86, 48], [62, 72], [75, 74], [87, 70],
] as const;

export default function Backdrop() {
  const vids = useRef<Record<string, HTMLVideoElement | null>>({});
  const layers = useRef<Record<string, HTMLDivElement | null>>({});
  const [routes, setRoutes] = useState(() => makeRoutes(7));
  const [replans, setReplans] = useState(0);
  const [agent, setAgent] = useState(0);
  const [detour, setDetour] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const onReplan = () => {
      setReplans((n) => n + 1);
      setRoutes(makeRoutes(Math.floor(Math.random() * 10000)));
    };
    const onAgent = (e: Event) => setAgent((e as CustomEvent<number>).detail ?? 0);
    const onReroute = () => setDetour(true);
    window.addEventListener(WORLD_EVENT.replan, onReplan);
    window.addEventListener(WORLD_EVENT.agent, onAgent);
    window.addEventListener(WORLD_EVENT.reroute, onReroute);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bolt = still
      ? 0
      : window.setInterval(() => {
          if (Math.random() < 0.35) {
            setFlash(true);
            window.setTimeout(() => setFlash(false), 120);
          }
        }, 1800);
    return () => {
      window.removeEventListener(WORLD_EVENT.replan, onReplan);
      window.removeEventListener(WORLD_EVENT.agent, onAgent);
      window.removeEventListener(WORLD_EVENT.reroute, onReroute);
      window.clearInterval(bolt);
    };
  }, []);

  // Cross-fade clips by scroll position, using the same stations as the 3D camera.
  useEffect(() => {
    let anchors: { y: number; key: string }[] = [];
    const measure = () => {
      anchors = [...document.querySelectorAll<HTMLElement>("[data-cam]")]
        .map((s) => {
          const r = s.getBoundingClientRect();
          return { y: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, key: s.dataset.cam ?? "" };
        })
        .sort((a, b) => a.y - b.y);
    };
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const w: Record<string, number> = {};
      if (anchors.length) {
        let i = 0;
        while (i < anchors.length - 1 && y > anchors[i + 1]!.y) i++;
        const a = anchors[i]!, b = anchors[Math.min(i + 1, anchors.length - 1)]!;
        const t = a === b ? 0 : smooth(Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y))));
        w[a.key] = (w[a.key] ?? 0) + 1 - t;
        if (b !== a) w[b.key] = (w[b.key] ?? 0) + t;
      }
      let cover = 0;
      for (const c of CLIPS) {
        const o = Math.min(1, w[c.key] ?? 0);
        cover += o;
        const layer = layers.current[c.key];
        if (layer) layer.style.opacity = o.toFixed(3);
        const v = vids.current[c.key];
        if (v) {
          if (o > 0.01 && v.paused) v.play().catch(() => {});
          else if (o <= 0.01 && !v.paused) v.pause();
        }
      }
      document.documentElement.dataset.cover = cover > 0.985 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => (measure(), update());
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const layer = (key: ClipKey) => ({
    ref: (el: HTMLDivElement | null) => {
      layers.current[key] = el;
    },
    className: "absolute inset-0 opacity-0",
  });

  const [tx, ty] = TOWER_SPOTS[agent]!;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5]">
      {CLIPS.map((c) => (
        <div key={c.key} {...layer(c.key)}>
          <video
            ref={(el) => {
              vids.current[c.key] = el;
            }}
            src={c.src}
            poster={c.poster}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover [filter:saturate(1.15)_contrast(1.08)]"
          />
          {/* Colour grade into the radar palette, darker where text sits */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(47,107,255,0.28),rgba(10,13,26,0.15)_45%,rgba(255,59,92,0.22))] mix-blend-soft-light" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(10,13,26,0.15),rgba(10,13,26,0.75))]" />

          {c.key === "fleet" && (
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {routes.map((r, i) => (
                <g key={`${replans}-${i}`} filter="url(#glow)">
                  <path d={r.d} fill="none" stroke={r.red ? "#ff3b5c" : "#2f6bff"} strokeWidth="2.5" strokeOpacity="0.7" strokeDasharray="14 10" className="animate-[dash_1.2s_linear_infinite]" pathLength={1000}>
                  </path>
                  <circle r="7" fill="#fff">
                    <animateMotion dur={`${r.dur.toFixed(1)}s`} repeatCount="indefinite" path={r.d} />
                  </circle>
                </g>
              ))}
            </svg>
          )}

          {c.key === "tower" && (
            <div className="absolute inset-0">
              <div
                className="absolute h-[18vh] w-[14vw] min-w-[110px] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                style={{ left: `${tx}%`, top: `${ty}%` }}
              >
                {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((k) => (
                  <span key={k} className={`absolute h-6 w-6 border-flare ${k}`} />
                ))}
                <span className="absolute inset-0 animate-pulse bg-flare/10" />
                <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-flare px-2 py-0.5 font-mono text-[0.7rem] font-bold text-white">
                  AGENT 0{agent + 1} · {AGENTS[agent]!.name.toUpperCase()}
                </span>
              </div>
              <div className="absolute inset-x-0 top-0 h-1/3 animate-[scan_4s_linear_infinite] bg-gradient-to-b from-transparent via-radar/15 to-transparent" />
            </div>
          )}

          {c.key === "storm" && (
            <>
              <div className="absolute inset-0 animate-[rain_0.5s_linear_infinite] opacity-50 [background-image:repeating-linear-gradient(105deg,transparent_0_9px,rgba(200,215,255,0.35)_9px_10px,transparent_10px_22px)] [background-size:220px_220px]" />
              <div className={`absolute inset-0 bg-[#cfdcff] transition-opacity duration-100 ${flash ? "opacity-25" : "opacity-0"}`} />
              <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
                <path d="M 0 700 C 400 690, 900 700, 1600 680" fill="none" stroke="#ff3b5c" strokeWidth="6" strokeOpacity={detour ? 0.3 : 0.9} strokeDasharray="20 12" />
                <g transform="translate(760 698)">
                  <circle r="34" fill="none" stroke="#ff3b5c" strokeWidth="5" className="animate-pulse" />
                  <path d="M -16 -16 L 16 16 M 16 -16 L -16 16" stroke="#ff3b5c" strokeWidth="6" />
                </g>
                <path
                  d="M 0 700 C 300 690, 420 520, 620 520 S 980 520, 1100 600 S 1400 690, 1600 680"
                  fill="none"
                  stroke="#2f6bff"
                  strokeWidth="7"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={detour ? 0 : 1}
                  style={{ transition: "stroke-dashoffset 1.8s ease-out", filter: "drop-shadow(0 0 8px #2f6bff)" }}
                />
              </svg>
            </>
          )}

          {c.key === "map" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[min(80vh,80vw)] rounded-full border border-radar/30">
                <div className="absolute inset-[16%] rounded-full border border-radar/20" />
                <div className="absolute inset-[33%] rounded-full border border-radar/20" />
                <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,rgba(47,107,255,0.45),transparent_22%)] [animation-duration:4s]" />
                {[[30, 34], [62, 28], [70, 64], [40, 70], [52, 48]].map(([x, y], i) => (
                  <span key={i} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flare shadow-[0_0_14px_#ff3b5c]" style={{ left: `${x}%`, top: `${y}%` }}>
                    <span className="absolute inset-0 animate-ping rounded-full bg-flare" />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
