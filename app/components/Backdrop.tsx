"use client";

// Control-room screens behind the middle of the page, drawn live in code (HUD style: thin lines,
// glow, scanning). While a section with data-cam="fleet|tower|storm|map" is on screen its screen
// fades in over the 3D globe world (which pauses while fully covered):
//   fleet → a night route map with trucks leaving light trails (re-plans on "Drop in an order")
//   tower → the nine-agent network with data packets flowing to the desk
//   storm → a weather radar with rain cells drifting over the N7 and the detour you approve
//   map   → a radar sweep over the network with shipment pings
import { useEffect, useRef, useState } from "react";
import { AGENTS } from "../data/site";
import { WORLD_EVENT } from "./World";

const KEYS = ["fleet", "tower", "storm", "map"] as const;
type Key = (typeof KEYS)[number];
const smooth = (t: number) => t * t * (3 - 2 * t);
const BLUE = "#2f6bff", SOFT = "#6e95ff", RED = "#ff3b5c";

/** Size a canvas to the window (DPR capped) and return its 2D context. */
function fit(c: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  c.width = Math.round(window.innerWidth * dpr);
  c.height = Math.round(window.innerHeight * dpr);
  const g = c.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

// ── Fleet: night route map ──────────────────────────────────────────────────
function useFleet(canvas: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    const c = canvas.current;
    if (!c || !active) return;
    let g = fit(c);
    let W = window.innerWidth, H = window.innerHeight;
    const STEP = 64;
    type P = { x: number; y: number };
    // Street grid with jittered junctions; trucks drive junction to junction.
    let cols = 0, rows = 0, nodes: P[][] = [];
    const build = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      cols = Math.ceil(W / STEP) + 2;
      rows = Math.ceil(H / STEP) + 2;
      nodes = Array.from({ length: cols }, (_, i) => Array.from({ length: rows }, (_, j) => ({ x: (i - 0.5) * STEP + (Math.random() - 0.5) * 18, y: (j - 0.5) * STEP + (Math.random() - 0.5) * 18 })));
    };
    build();
    type Truck = { i: number; j: number; ti: number; tj: number; k: number; speed: number; trail: P[]; red: boolean; flash: number };
    const N = window.innerWidth < 768 ? 22 : 46;
    const pickNext = (t: Truck) => {
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => t.i + a! >= 0 && t.i + a! < cols && t.j + b! >= 0 && t.j + b! < rows);
      const [a, b] = opts[Math.floor(Math.random() * opts.length)]!;
      t.ti = t.i + a!;
      t.tj = t.j + b!;
      t.k = 0;
    };
    const trucks: Truck[] = Array.from({ length: N }, (_, n) => {
      const t: Truck = { i: Math.floor(Math.random() * cols), j: Math.floor(Math.random() * rows), ti: 0, tj: 0, k: 0, speed: 0.9 + Math.random() * 1.4, trail: [], red: n % 3 === 0, flash: 0 };
      pickNext(t);
      return t;
    });
    const hubs = [
      { x: 0.22, y: 0.3, name: "UTTARA DC" },
      { x: 0.48, y: 0.55, name: "TEJGAON HUB" },
      { x: 0.7, y: 0.36, name: "AIRPORT CARGO" },
      { x: 0.33, y: 0.78, name: "KERANIGANJ" },
      { x: 0.84, y: 0.7, name: "N1 → CHATTOGRAM" },
    ];
    let replanAt = -1;
    const onReplan = () => {
      replanAt = performance.now();
      trucks.forEach((t) => (t.flash = 1));
    };
    window.addEventListener(WORLD_EVENT.replan, onReplan);
    const onResize = () => {
      g = fit(c);
      build();
      trucks.forEach((t) => {
        t.i = Math.min(t.i, cols - 1);
        t.j = Math.min(t.j, rows - 1);
        pickNext(t);
        t.trail = [];
      });
    };
    window.addEventListener("resize", onResize);

    let frame = 0, last = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "#070a14";
      g.fillRect(0, 0, W, H);
      // River
      g.strokeStyle = "rgba(20,40,96,0.9)";
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(-20, H * 0.9);
      g.bezierCurveTo(W * 0.3, H * 0.62, W * 0.55, H * 1.02, W + 20, H * 0.82);
      g.stroke();
      // Streets
      g.lineWidth = 1;
      g.strokeStyle = "rgba(60,80,150,0.32)";
      g.beginPath();
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const p = nodes[i]![j]!;
          if (i + 1 < cols) {
            g.moveTo(p.x, p.y);
            g.lineTo(nodes[i + 1]![j]!.x, nodes[i + 1]![j]!.y);
          }
          if (j + 1 < rows) {
            g.moveTo(p.x, p.y);
            g.lineTo(nodes[i]![j + 1]!.x, nodes[i]![j + 1]!.y);
          }
        }
      g.stroke();
      // Ring road
      g.strokeStyle = "rgba(47,107,255,0.45)";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(W * 0.5, H * 0.52, W * 0.36, H * 0.34, -0.12, 0, Math.PI * 2);
      g.stroke();
      // Re-plan wave
      if (replanAt > 0) {
        const k = (now - replanAt) / 1400;
        if (k < 1) {
          g.strokeStyle = `rgba(110,149,255,${(1 - k) * 0.8})`;
          g.lineWidth = 2;
          g.beginPath();
          g.arc(W * 0.48, H * 0.55, k * Math.max(W, H), 0, Math.PI * 2);
          g.stroke();
        }
      }
      // Trucks + trails (additive light)
      g.globalCompositeOperation = "lighter";
      for (const t of trucks) {
        if (!still) {
          t.k += (t.speed * dt * (1 + t.flash * 2)) / 1.1;
          if (t.k >= 1) {
            t.i = t.ti;
            t.j = t.tj;
            pickNext(t);
          }
        }
        const a = nodes[t.i]![t.j]!, b = nodes[t.ti]![t.tj]!;
        const x = a.x + (b.x - a.x) * t.k, y = a.y + (b.y - a.y) * t.k;
        t.trail.push({ x, y });
        if (t.trail.length > 40) t.trail.shift();
        const col = t.red ? "255,59,92" : "79,130,255";
        g.lineWidth = 2;
        for (let n = 1; n < t.trail.length; n++) {
          const p0 = t.trail[n - 1]!, p1 = t.trail[n]!;
          g.strokeStyle = `rgba(${col},${(n / t.trail.length) * 0.75})`;
          g.beginPath();
          g.moveTo(p0.x, p0.y);
          g.lineTo(p1.x, p1.y);
          g.stroke();
        }
        g.fillStyle = t.flash > 0 ? "#ffffff" : `rgb(${col})`;
        g.beginPath();
        g.arc(x, y, 2.6 + t.flash * 2, 0, Math.PI * 2);
        g.fill();
        t.flash = Math.max(0, t.flash - dt * 0.6);
      }
      // Hubs with labels
      g.globalCompositeOperation = "source-over";
      g.font = "600 11px ui-monospace, Menlo, monospace";
      hubs.forEach((h, n) => {
        const x = h.x * W, y = h.y * H;
        const pulse = (now / 1000 + n * 0.4) % 1.6;
        g.strokeStyle = `rgba(255,59,92,${Math.max(0, 1 - pulse / 1.6)})`;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, 6 + pulse * 18, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = RED;
        g.fillRect(x - 4, y - 4, 8, 8);
        g.fillStyle = "rgba(238,241,250,0.75)";
        g.fillText(h.name, x + 12, y + 4);
      });
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!document.hidden) draw();
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(WORLD_EVENT.replan, onReplan);
      window.removeEventListener("resize", onResize);
    };
  }, [canvas, active]);
}

// ── Storm: weather radar over the highway ───────────────────────────────────
function useRadar(canvas: React.RefObject<HTMLCanvasElement | null>, active: boolean, detourAt: React.RefObject<number>) {
  useEffect(() => {
    const c = canvas.current;
    if (!c || !active) return;
    let g = fit(c);
    // Value noise on a small grid → smooth rain cells, drawn into a low-res buffer then scaled up.
    const GW = 120, GH = 68, R = 64;
    const rnd = new Float32Array(R * R).map(() => Math.random());
    const at = (x: number, y: number) => rnd[(((y % R) + R) % R) * R + (((x % R) + R) % R)]!;
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = at(xi, yi), b = at(xi + 1, yi), cc = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v;
    };
    const buf = document.createElement("canvas");
    buf.width = GW;
    buf.height = GH;
    const bg = buf.getContext("2d")!;
    const img = bg.createImageData(GW, GH);
    const ramp = (v: number): [number, number, number, number] => {
      if (v < 0.5) return [0, 0, 0, 0];
      if (v < 0.6) return [40, 200, 140, 120];
      if (v < 0.7) return [120, 220, 90, 150];
      if (v < 0.78) return [250, 210, 60, 170];
      if (v < 0.86) return [255, 140, 60, 190];
      return [255, 59, 92, 215];
    };
    const onResize = () => (g = fit(c));
    window.addEventListener("resize", onResize);
    const towns = [
      { x: 0.12, y: 0.66, n: "DHAKA" },
      { x: 0.38, y: 0.6, n: "FARIDPUR" },
      { x: 0.62, y: 0.68, n: "JASHORE" },
      { x: 0.88, y: 0.62, n: "KOLKATA" },
    ];
    let frame = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const t = still ? 10 : performance.now() / 1000;
      g.fillStyle = "#060914";
      g.fillRect(0, 0, W, H);
      // Map grid + range rings
      g.strokeStyle = "rgba(60,80,150,0.18)";
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x < W; x += 48) {
        g.moveTo(x, 0);
        g.lineTo(x, H);
      }
      for (let y = 0; y < H; y += 48) {
        g.moveTo(0, y);
        g.lineTo(W, y);
      }
      g.stroke();
      const cx = W * 0.42, cy = H * 0.55;
      g.strokeStyle = "rgba(110,149,255,0.25)";
      [0.15, 0.3, 0.45].forEach((r) => {
        g.beginPath();
        g.arc(cx, cy, r * Math.max(W, H), 0, Math.PI * 2);
        g.stroke();
      });
      // Rain cells drifting east, heaviest over the middle of the route
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++) {
          const v = noise(x / 9 - t * 0.35, y / 9 + Math.sin(t * 0.1) * 0.5) * 0.65 + noise(x / 4 - t * 0.6, y / 4) * 0.35;
          const dx = x / GW - 0.42, dy = y / GH - 0.55;
          const focus = Math.exp(-(dx * dx * 6 + dy * dy * 9));
          const [r, gg, b, a] = ramp(v * (0.55 + focus * 0.6));
          const o = (y * GW + x) * 4;
          img.data[o] = r;
          img.data[o + 1] = gg;
          img.data[o + 2] = b;
          img.data[o + 3] = a;
        }
      bg.putImageData(img, 0, 0);
      // Upscale the low-res field with a blur so cells read as soft radar echoes, not pixels.
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.filter = "blur(10px)";
      g.drawImage(buf, 0, 0, W, H);
      g.filter = "none";
      // Radar sweep
      const grad = g.createConicGradient((t * 1.2) % (Math.PI * 2), cx, cy);
      grad.addColorStop(0, "rgba(110,149,255,0.35)");
      grad.addColorStop(0.08, "rgba(110,149,255,0)");
      grad.addColorStop(1, "rgba(110,149,255,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, Math.max(W, H), 0, Math.PI * 2);
      g.fill();
      // Route N7 (red) and the detour (blue, drawn once approved)
      const p = towns.map((tw) => [tw.x * W, tw.y * H] as const);
      const approved = detourAt.current > 0;
      g.setLineDash([14, 10]);
      g.lineDashOffset = -t * 30;
      g.strokeStyle = approved ? "rgba(255,59,92,0.35)" : RED;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(p[0]![0], p[0]![1]);
      p.slice(1).forEach(([x, y]) => g.lineTo(x, y));
      g.stroke();
      g.setLineDash([]);
      if (approved) {
        const k = Math.min(1, (performance.now() - detourAt.current) / 1800);
        const path = new Path2D();
        path.moveTo(p[0]![0], p[0]![1]);
        path.bezierCurveTo(W * 0.24, H * 0.32, W * 0.5, H * 0.3, p[2]![0], p[2]![1]);
        path.lineTo(p[3]![0], p[3]![1]);
        g.save();
        g.shadowColor = BLUE;
        g.shadowBlur = 16;
        g.strokeStyle = BLUE;
        g.lineWidth = 5;
        g.setLineDash([3000]);
        g.lineDashOffset = 3000 * (1 - k);
        g.stroke(path);
        g.restore();
      }
      // Blocked marker at Faridpur
      const [bx, by] = p[1]!;
      g.strokeStyle = RED;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(bx, by, 16 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      g.moveTo(bx - 8, by - 8);
      g.lineTo(bx + 8, by + 8);
      g.moveTo(bx + 8, by - 8);
      g.lineTo(bx - 8, by + 8);
      g.stroke();
      g.font = "600 11px ui-monospace, Menlo, monospace";
      towns.forEach((tw, i) => {
        const [x, y] = p[i]!;
        g.fillStyle = "#eef1fa";
        g.fillRect(x - 3, y - 3, 6, 6);
        g.fillStyle = "rgba(238,241,250,0.8)";
        g.fillText(tw.n, x + 10, y - 10);
      });
      g.fillStyle = "rgba(238,241,250,0.55)";
      g.fillText("RADAR · CYCLONE CELL · MOVING E 32 KM/H", 24, H - 28);
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!document.hidden) draw();
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [canvas, active, detourAt]);
}

// ── Tower: the agent network (SVG) ───────────────────────────────────────────
function AgentNet({ agent }: { agent: number }) {
  const cx = 1060, cy = 450;
  const nodes = AGENTS.map((a, i) => {
    const ang = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    return { ...a, x: cx + Math.cos(ang) * 330, y: cy + Math.sin(ang) * 300 };
  });
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full bg-[#070a14]">
      <defs>
        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(110,149,255,0.18)" />
        </pattern>
        <radialGradient id="core">
          <stop offset="0" stopColor="#2f6bff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#dots)" />
      <circle cx={cx} cy={cy} r="260" fill="url(#core)" />
      {[150, 250, 400].map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={SOFT}
          strokeOpacity="0.22"
          strokeDasharray={i === 1 ? "4 10" : "1 6"}
          className="animate-spin"
          style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: `${40 + i * 20}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
        />
      ))}
      {nodes.map((n, i) => {
        const next = nodes[(i + 1) % nodes.length]!;
        const d = `M ${n.x} ${n.y} L ${cx} ${cy}`;
        const on = i === agent;
        return (
          <g key={n.name}>
            <path d={d} stroke={on ? RED : SOFT} strokeOpacity={on ? 0.9 : 0.3} strokeWidth={on ? 2 : 1} fill="none" />
            <path d={`M ${n.x} ${n.y} Q ${cx} ${cy} ${next.x} ${next.y}`} stroke={SOFT} strokeOpacity="0.1" fill="none" />
            <circle r={on ? 5 : 3.5} fill={on ? "#fff" : SOFT}>
              <animateMotion dur={`${1.6 + (i % 4) * 0.5}s`} repeatCount="indefinite" path={d} />
            </circle>
            <circle cx={n.x} cy={n.y} r={on ? 34 : 22} fill="#0e1430" stroke={on ? RED : BLUE} strokeWidth={on ? 3 : 1.5} />
            {on && <circle cx={n.x} cy={n.y} r="46" fill="none" stroke={RED} strokeOpacity="0.5" className="animate-ping" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />}
            <text x={n.x} y={n.y + (on ? 60 : 44)} textAnchor="middle" fill={on ? "#fff" : "rgba(238,241,250,0.6)"} fontSize={on ? 17 : 13} fontWeight="700" fontFamily="ui-monospace, Menlo, monospace">
              {n.name.toUpperCase()}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="54" fill="#0e1430" stroke={BLUE} strokeWidth="3" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800" fontFamily="ui-monospace, Menlo, monospace">
        OPS
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill={SOFT} fontSize="12" fontFamily="ui-monospace, Menlo, monospace">
        DESK
      </text>
    </svg>
  );
}

// ── Map: radar sweep with shipment pings ─────────────────────────────────────
function MapSweep() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#070a14] bg-[radial-gradient(rgba(110,149,255,0.16)_1px,transparent_1px)] [background-size:26px_26px]">
      <div className="relative aspect-square w-[min(84vh,84vw)] rounded-full border border-radar/30">
        <div className="absolute inset-[16%] rounded-full border border-radar/20" />
        <div className="absolute inset-[33%] rounded-full border border-radar/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-radar/20" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-radar/20" />
        <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,rgba(47,107,255,0.45),transparent_22%)] [animation-duration:4s]" />
        {[[30, 34], [62, 28], [70, 64], [40, 70], [52, 48], [22, 56], [78, 42]].map(([x, y], i) => (
          <span key={i} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flare shadow-[0_0_14px_#ff3b5c]" style={{ left: `${x}%`, top: `${y}%` }}>
            <span className="absolute inset-0 animate-ping rounded-full bg-flare" style={{ animationDelay: `${i * 0.3}s` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Backdrop() {
  const root = useRef<HTMLDivElement>(null);
  const fleetCanvas = useRef<HTMLCanvasElement>(null);
  const radarCanvas = useRef<HTMLCanvasElement>(null);
  const detourAt = useRef(0);
  const [visible, setVisible] = useState<Record<Key, boolean>>({ fleet: false, tower: false, storm: false, map: false });
  const [agent, setAgent] = useState(0);

  // Each screen only animates while it can be seen.
  useFleet(fleetCanvas, visible.fleet);
  useRadar(radarCanvas, visible.storm, detourAt);

  useEffect(() => {
    const onAgent = (e: Event) => setAgent((e as CustomEvent<number>).detail ?? 0);
    const onReroute = () => (detourAt.current = performance.now());
    window.addEventListener(WORLD_EVENT.agent, onAgent);
    window.addEventListener(WORLD_EVENT.reroute, onReroute);
    return () => {
      window.removeEventListener(WORLD_EVENT.agent, onAgent);
      window.removeEventListener(WORLD_EVENT.reroute, onReroute);
    };
  }, []);

  // Cross-fade screens by scroll position, using the same stations as the 3D camera.
  useEffect(() => {
    let anchors: { y: number; key: string }[] = [];
    const shown: Record<string, boolean> = {};
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
      let cover = 0, changed = false;
      for (const k of KEYS) {
        const o = Math.min(1, w[k] ?? 0);
        cover += o;
        const layer = root.current?.querySelector<HTMLElement>(`[data-layer="${k}"]`);
        if (layer) layer.style.opacity = o.toFixed(3);
        const on = o > 0.01;
        if (shown[k] !== on) {
          shown[k] = on;
          changed = true;
        }
      }
      if (changed) setVisible({ fleet: !!shown.fleet, tower: !!shown.tower, storm: !!shown.storm, map: !!shown.map });
      document.documentElement.dataset.cover = cover > 0.985 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
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

  const layer = (k: Key) => ({ "data-layer": k, className: "absolute inset-0 opacity-0" });

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5]">
      <div {...layer("fleet")}>
        <canvas ref={fleetCanvas} className="absolute inset-0 h-full w-full" />
      </div>
      <div {...layer("tower")}>{visible.tower && <AgentNet agent={agent} />}</div>
      <div {...layer("storm")}>
        <canvas ref={radarCanvas} className="absolute inset-0 h-full w-full" />
      </div>
      <div {...layer("map")}>{visible.map && <MapSweep />}</div>
    </div>
  );
}
