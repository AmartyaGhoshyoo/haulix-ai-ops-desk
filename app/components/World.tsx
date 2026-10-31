"use client";

// One fixed three.js canvas behind the whole page, flying a camera through four real 3D places:
// the Earth from orbit, a night motorway interchange and a container port (real aerial photos
// raised into 3D from depth maps), and a warehouse built from CC0 Poly Haven models. Each page
// section says where the camera should be with data-cam="…". Scrolling through a section moves
// the camera from its station's `a` shot to its `b` shot; moving to a section in another place
// cuts through black, like a film edit. Page buttons talk to the world with window events.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Place } from "./world/common";
import { createGlobe } from "./world/globe";
import { createHighway } from "./world/highway";
import { createPort } from "./world/port";
import { createWarehouse } from "./world/warehouse";

export const WORLD_EVENT = { replan: "haulix:replan", agent: "haulix:agent", reroute: "haulix:reroute" } as const;

type PlaceKey = "globe" | "highway" | "warehouse" | "port";
type V3 = [number, number, number];
type Shot = { p: V3; l: V3 };
type Station = { place: PlaceKey; a: Shot; b: Shot };

const STATIONS: Record<string, Station> = {
  globe: { place: "globe", a: { p: [-2.7, 0.4, 7.6], l: [-2.7, 0.2, 0] }, b: { p: [-2.1, 0.8, 5.8], l: [-2.1, 0.3, 0] } },
  fleet: { place: "highway", a: { p: [-6, 34, 42], l: [4, 0, 0] }, b: { p: [-14, 12, 20], l: [2, 1, -6] } },
  tower: { place: "warehouse", a: { p: [-6, 8, 19], l: [5, 1.6, 0] }, b: { p: [1, 3.6, 11], l: [9, 1.4, 1] } },
  storm: { place: "port", a: { p: [-16, 26, 34], l: [-4, 2, 0] }, b: { p: [-22, 10, 18], l: [-6, 2, -3] } },
  map: { place: "port", a: { p: [0, 58, 0.01], l: [0, 0, 0] }, b: { p: [0, 46, 0.01], l: [0, 0, 0] } },
  end: { place: "globe", a: { p: [0, 0.2, 8], l: [0, 0.2, 0] }, b: { p: [0, 0.6, 6.2], l: [0, 0.6, 0] } },
};
// Phones are tall and the text sits low: frame the subject in the top half instead of beside it.
const PHONE: Record<string, Partial<Station>> = {
  globe: { a: { p: [0, -2.2, 9.6], l: [0, -2.2, 0] }, b: { p: [0, -1.9, 8], l: [0, -1.9, 0] } },
  end: { a: { p: [0, -1.4, 9.5], l: [0, -1.4, 0] }, b: { p: [0, -1, 8], l: [0, -1, 0] } },
  fleet: { a: { p: [0, 44, 46], l: [0, 0, -4] }, b: { p: [-6, 18, 28], l: [0, 1, -8] } },
  tower: { a: { p: [0, 12, 28], l: [2, 2, -2] }, b: { p: [4, 6, 18], l: [6, 1.6, -4] } },
  storm: { a: { p: [-6, 34, 40], l: [-2, 2, -4] }, b: { p: [-10, 16, 26], l: [-4, 2, -6] } },
  map: { a: { p: [0, 80, 0.01], l: [0, 0, 0] }, b: { p: [0, 66, 0.01], l: [0, 0, 0] } },
};

const IN = 0.18; // share of each section spent arriving from the previous station
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export default function World() {
  const host = useRef<HTMLDivElement>(null);
  const black = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 400);

    // ── Places load in the background; the globe first so the page opens fast ──
    const places: Partial<Record<PlaceKey, Place>> = {};
    let alive = true;
    let highway: Awaited<ReturnType<typeof createHighway>> | undefined;
    let warehouse: Awaited<ReturnType<typeof createWarehouse>> | undefined;
    let port: Awaited<ReturnType<typeof createPort>> | undefined;
    let pendingAgent = 0;
    const done = () => alive && setLoaded((n) => n + 1);
    createGlobe().then((g) => {
      places.globe = g;
      done();
      if (alive) setReady(true);
      createHighway().then((h) => ((places.highway = highway = h), done()));
      createWarehouse(renderer).then((w) => {
        places.warehouse = warehouse = w;
        w.setAgent(pendingAgent);
        done();
      });
      createPort().then((p) => ((places.port = port = p), done()));
    });

    const onReplan = () => (highway?.replan(), warehouse?.replan());
    const onAgent = (e: Event) => {
      pendingAgent = Number((e as CustomEvent).detail) || 0;
      warehouse?.setAgent(pendingAgent);
    };
    const onReroute = () => port?.reroute();
    window.addEventListener(WORLD_EVENT.replan, onReplan);
    window.addEventListener(WORLD_EVENT.agent, onAgent);
    window.addEventListener(WORLD_EVENT.reroute, onReroute);

    // ── Stations from the page layout ─────────────────────────────────────────
    let sections: { top: number; height: number; key: string; st: Station }[] = [];
    const measure = () => {
      const phone = window.innerWidth < 768;
      sections = [...document.querySelectorAll<HTMLElement>("[data-cam]")]
        .map((s) => {
          const r = s.getBoundingClientRect();
          const key = s.dataset.cam ?? "globe";
          const base = STATIONS[key] ?? STATIONS.globe!;
          return { top: r.top + window.scrollY, height: Math.max(1, r.height), key, st: phone ? { ...base, ...PHONE[key] } : base };
        })
        .sort((a, b) => a.top - b.top);
    };
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 768 ? 58 : 45;
      camera.updateProjectionMatrix();
      measure();
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Where should the camera be right now? Sets tPos/tLook; returns the place and how dark the cut is.
    const tPos = new THREE.Vector3(), tLook = new THREE.Vector3(), tmp = new THREE.Vector3();
    const setShot = (a: Shot, b: Shot, k: number) => {
      tPos.set(...a.p).lerp(tmp.set(...b.p), k);
      tLook.set(...a.l).lerp(tmp.set(...b.l), k);
    };
    const target = (): { place: PlaceKey; key: string; dark: number } => {
      if (!sections.length) {
        setShot(STATIONS.globe!.a, STATIONS.globe!.a, 0);
        return { place: "globe", key: "globe", dark: 0 };
      }
      const mid = window.scrollY + window.innerHeight / 2;
      let i = 0;
      while (i < sections.length - 1 && mid >= sections[i + 1]!.top) i++;
      const cur = sections[i]!;
      const s = clamp01((mid - cur.top) / cur.height);
      const prev = sections[i - 1];
      if (prev && s < IN) {
        const k = s / IN;
        if (prev.st.place === cur.st.place) {
          setShot(prev.st.b, cur.st.a, smooth(k));
          return { place: cur.st.place, key: cur.key, dark: 0 };
        }
        // A cut between places: fade to black on the old place, come up on the new one.
        if (k < 0.5) {
          setShot(prev.st.b, prev.st.b, 0);
          return { place: prev.st.place, key: prev.key, dark: smooth(k * 2) };
        }
        setShot(cur.st.a, cur.st.a, 0);
        return { place: cur.st.place, key: cur.key, dark: smooth(2 - k * 2) };
      }
      setShot(cur.st.a, cur.st.b, smooth(clamp01((s - IN) / (1 - IN))));
      return { place: cur.st.place, key: cur.key, dark: 0 };
    };

    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
    let shown: PlaceKey | null = null;
    let frame = 0, last = performance.now();
    const clock = new THREE.Clock();
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = still ? 6 : clock.getElapsedTime();
      const { place, key, dark } = target();
      const p = places[place];
      // A place that hasn't loaded yet shows black rather than the wrong scene.
      if (black.current) black.current.style.opacity = String(p ? dark : 1);
      if (!p) return;
      if (place !== shown || still) {
        camPos.copy(tPos);
        camLook.copy(tLook);
        shown = place;
      } else {
        camPos.lerp(tPos, 0.08);
        camLook.lerp(tLook, 0.08);
      }
      const sway = place === "globe" ? 0.12 : 1.2;
      camera.position.copy(camPos).add(tmp.set(mouse.x * sway, -mouse.y * sway * 0.6, 0));
      camera.lookAt(camLook);
      port?.setMode(key === "map" ? "map" : "storm");
      p.update(time, still ? 0 : dt, camera);
      renderer.render(p.scene, camera);
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!document.hidden) draw();
    };
    let timer = 0;
    const onScroll = () => draw();
    if (still) {
      window.addEventListener("scroll", onScroll, { passive: true });
      timer = window.setInterval(draw, 500);
    } else loop();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener(WORLD_EVENT.replan, onReplan);
      window.removeEventListener(WORLD_EVENT.agent, onAgent);
      window.removeEventListener(WORLD_EVENT.reroute, onReroute);
      ro.disconnect();
      Object.values(places).forEach((pl) => pl?.dispose());
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={host} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-night [&>canvas]:h-full [&>canvas]:w-full" />
      <div ref={black} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#03040a]" style={{ opacity: 1 }} />
      <div
        aria-hidden={ready}
        className={`pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#03040a] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <p className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-ink/70">Loading the world</p>
        <div className="h-px w-40 overflow-hidden bg-ink/15">
          <div className="h-full bg-radar transition-[width] duration-500" style={{ width: `${Math.max(12, (loaded / 4) * 100)}%` }} />
        </div>
      </div>
    </>
  );
}
