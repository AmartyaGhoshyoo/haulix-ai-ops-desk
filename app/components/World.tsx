"use client";

// One fixed three.js world behind the whole page. As you scroll, the camera flies between
// stations marked in the HTML with data-cam="…": the globe in orbit, a night city where trucks
// leave light trails, the port with the nine-agent container tower, a storm on the highway,
// and a top-down map. Page buttons talk to it with window events (replan, agent, reroute).
// Every texture here is drawn in code (canvas), nothing is downloaded.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LAND } from "../data/land";

export const WORLD_EVENT = { replan: "haulix:replan", agent: "haulix:agent", reroute: "haulix:reroute" } as const;

const BLUE = 0x2f6bff, RED = 0xff3b5c, BG = 0x0a0d1a;

type Key = { p: [number, number, number]; l: [number, number, number] };
const CAM: Record<string, Key> = {
  globe: { p: [-30, 146, 88], l: [-30, 150, 0] },
  fleet: { p: [30, 22, 40], l: [0, 0, 2] },
  tower: { p: [60, 15, -4], l: [36, 5, -30] },
  storm: { p: [24, 17, -60], l: [-4, 7, -92] },
  map: { p: [0, 100, 4], l: [0, 0, -12] },
  end: { p: [-40, 160, 110], l: [-40, 150, 0] },
};

// Phones are tall: lift the globe above the text instead of beside it.
const CAM_PHONE: Record<string, Key> = {
  globe: { p: [0, 132, 112], l: [0, 124, 0] },
  end: { p: [0, 130, 118], l: [0, 142, 0] },
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function windowsTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8)
    for (let x = 4; x < 64; x += 8) {
      const r = Math.random();
      if (r < 0.32) {
        g.fillStyle = r < 0.05 ? "#ff3b5c" : r < 0.16 ? "#6e95ff" : "#dfe6ff";
        g.globalAlpha = 0.35 + Math.random() * 0.65;
        g.fillRect(x, y, 4, 4);
      }
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function toVec(lat: number, lng: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export default function World() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.setClearColor(BG);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 50, 230);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);

    scene.add(new THREE.HemisphereLight(0x6e95ff, 0x0a0d1a, 0.9));
    const sun = new THREE.DirectionalLight(0xdfe6ff, 1.1);
    sun.position.set(30, 60, 20);
    scene.add(sun);
    const disposables: { dispose: () => void }[] = [];
    const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

    // ── Globe in orbit ─────────────────────────────────────────────────────────
    const globe = new THREE.Group();
    globe.position.set(0, 150, 0);
    scene.add(globe);
    const GR = 28;
    const dots = new Float32Array(LAND.length * 1.5);
    for (let i = 0; i < LAND.length; i += 2) dots.set(toVec(LAND[i]!, LAND[i + 1]!, GR * 1.004).toArray(), i * 1.5);
    const dotGeo = keep(new THREE.BufferGeometry());
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dots, 3));
    globe.add(new THREE.Points(dotGeo, keep(new THREE.PointsMaterial({ color: 0x9fb6ff, size: 0.42, transparent: true, opacity: 0.9, fog: false }))));
    globe.add(new THREE.Mesh(keep(new THREE.SphereGeometry(GR, 64, 64)), keep(new THREE.MeshBasicMaterial({ color: 0x0e1430, fog: false }))));
    const rim = new THREE.Mesh(
      keep(new THREE.SphereGeometry(GR * 1.18, 64, 64)),
      keep(
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
          fragmentShader: "varying vec3 vN; void main(){ float i = pow(clamp(-vN.z,0.0,1.0),1.6); gl_FragColor = vec4(mix(vec3(0.18,0.42,1.0), vec3(1.0,0.23,0.36), 0.25), 1.0) * i * 1.2; }",
        }),
      ),
    );
    rim.position.copy(globe.position);
    scene.add(rim);
    const hubs: [number, number][] = [[22.3, 91.8], [51.9, 4.5], [1.35, 103.8], [25.2, 55.3], [40.7, -74], [22.5, 114.1], [19.1, 72.9], [6.9, 79.9], [34, -118.2], [-33.9, 151.2]];
    const lanes = [[0, 1], [0, 2], [2, 5], [3, 1], [6, 3], [4, 1], [5, 8], [2, 9], [7, 1], [0, 6]];
    const arcCurves = lanes.map(([a, b]) => {
      const A = toVec(...hubs[a!]!, GR), B = toVec(...hubs[b!]!, GR);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      return new THREE.QuadraticBezierCurve3(A, mid.normalize().multiplyScalar(GR * (1 + A.distanceTo(B) / GR / 2.4)), B);
    });
    arcCurves.forEach((c, i) => {
      globe.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(c.getPoints(60))), keep(new THREE.LineBasicMaterial({ color: i % 3 === 0 ? RED : BLUE, transparent: true, opacity: 0.85, fog: false }))));
    });
    const arcPackets = arcCurves.map((_, i) => {
      const m = new THREE.Mesh(keep(new THREE.SphereGeometry(0.45, 8, 8)), keep(new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffb3c0 : 0xcfdcff, fog: false })));
      globe.add(m);
      return m;
    });
    hubs.forEach((h) => {
      const m = new THREE.Mesh(keep(new THREE.SphereGeometry(0.55, 10, 10)), keep(new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })));
      m.position.copy(toVec(...h, GR));
      globe.add(m);
    });
    // Stars
    const starPos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(260 + Math.random() * 120);
      starPos.set([v.x, v.y + 150, v.z], i * 3);
    }
    const starGeo = keep(new THREE.BufferGeometry());
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, keep(new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.7, fog: false }))));

    // ── Night city ────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(400, 400)), keep(new THREE.MeshStandardMaterial({ color: 0x070914, roughness: 0.95 })));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(400, 80, 0x1a2550, 0x111833);
    grid.position.y = 0.01;
    scene.add(grid);
    const STREET = 10, HALF = 50;
    const streetPts: number[] = [];
    for (let s = -HALF; s <= HALF; s += STREET) streetPts.push(s, 0.05, -HALF, s, 0.05, HALF, -HALF, 0.05, s, HALF, 0.05, s);
    const streetGeo = keep(new THREE.BufferGeometry());
    streetGeo.setAttribute("position", new THREE.Float32BufferAttribute(streetPts, 3));
    scene.add(new THREE.LineSegments(streetGeo, keep(new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.28 }))));

    const winTex = keep(windowsTexture());
    const bMat = keep(new THREE.MeshStandardMaterial({ color: 0x131a36, roughness: 0.55, metalness: 0.3, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.9 }));
    const spots: THREE.Matrix4[] = [];
    for (let bx = -HALF; bx < HALF; bx += STREET)
      for (let bz = -HALF; bz < HALF; bz += STREET) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) {
          const w = 2.4 + Math.random() * 3, d = 2.4 + Math.random() * 3;
          const center = Math.abs(bx + 5) < 20 && Math.abs(bz + 5) < 20;
          const h = (center ? 6 : 2) + Math.random() * (center ? 16 : 7);
          const x = bx + 1.8 + w / 2 + Math.random() * (STREET - 3.6 - w);
          const z = bz + 1.8 + d / 2 + Math.random() * (STREET - 3.6 - d);
          spots.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)));
        }
      }
    const buildings = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(1, 1, 1)), bMat, spots.length);
    spots.forEach((m, i) => buildings.setMatrixAt(i, m));
    scene.add(buildings);

    // Trucks with light trails, driving rectangular loops along the streets.
    const TRUCKS = small ? 18 : 36, TRAIL = 26;
    const truckGeo = keep(new THREE.BoxGeometry(1.3, 0.7, 0.7));
    type Truck = { mesh: THREE.Mesh; loop: THREE.Vector3[]; len: number; s: number; speed: number; trail: Float32Array; line: THREE.Line; col: THREE.Color; flash: number };
    const pickStreet = () => -HALF + STREET * Math.floor(Math.random() * 11);
    const makeLoop = () => {
      const x1 = pickStreet(), z1 = pickStreet();
      let x2 = pickStreet(), z2 = pickStreet();
      if (x1 === x2) x2 = x1 === HALF ? x1 - 20 : Math.min(HALF, x1 + 20);
      if (z1 === z2) z2 = z1 === HALF ? z1 - 20 : Math.min(HALF, z1 + 20);
      const loop = [new THREE.Vector3(x1, 0.5, z1), new THREE.Vector3(x2, 0.5, z1), new THREE.Vector3(x2, 0.5, z2), new THREE.Vector3(x1, 0.5, z2)];
      const len = 2 * (Math.abs(x2 - x1) + Math.abs(z2 - z1));
      return { loop, len };
    };
    const at = (t: Truck, s: number, out: THREE.Vector3) => {
      let d = ((s % t.len) + t.len) % t.len;
      for (let i = 0; i < 4; i++) {
        const a = t.loop[i]!, b = t.loop[(i + 1) % 4]!;
        const seg = a.distanceTo(b);
        if (d <= seg) return out.copy(a).lerp(b, d / seg);
        d -= seg;
      }
      return out.copy(t.loop[0]!);
    };
    const trucks: Truck[] = [];
    for (let i = 0; i < TRUCKS; i++) {
      const col = new THREE.Color(i % 2 ? RED : BLUE);
      const mesh = new THREE.Mesh(truckGeo, keep(new THREE.MeshStandardMaterial({ color: 0xdfe6ff, emissive: col, emissiveIntensity: 0.6 })));
      scene.add(mesh);
      const trail = new Float32Array(TRAIL * 3);
      const colors = new Float32Array(TRAIL * 3);
      for (let k = 0; k < TRAIL; k++) {
        const f = 1 - k / TRAIL;
        colors.set([col.r * f, col.g * f, col.b * f], k * 3);
      }
      const g = keep(new THREE.BufferGeometry());
      g.setAttribute("position", new THREE.BufferAttribute(trail, 3));
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const line = new THREE.Line(g, keep(new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true })));
      scene.add(line);
      const { loop, len } = makeLoop();
      trucks.push({ mesh, loop, len, s: Math.random() * len, speed: 5 + Math.random() * 5, trail, line, col, flash: 0 });
    }

    // ── Port, ship and the nine-agent container tower ────────────────────────
    const water = new THREE.Mesh(keep(new THREE.PlaneGeometry(80, 160)), keep(new THREE.MeshStandardMaterial({ color: 0x0a1a44, roughness: 0.25, metalness: 0.6, emissive: 0x06102c })));
    water.rotation.x = -Math.PI / 2;
    water.position.set(100, 0.03, 0);
    scene.add(water);
    const conGeo = keep(new THREE.BoxGeometry(2.4, 1.1, 1));
    const palette = [BLUE, RED, 0xdfe6ff, 0x1d2a66, 0x4a73ff];
    const conMats = palette.map((c) => keep(new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.2, emissive: c, emissiveIntensity: 0.12 })));
    const yard = new THREE.Group();
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 10; c++) {
        const h = 1 + Math.floor(Math.random() * 4);
        for (let y = 0; y < h; y++) {
          const m = new THREE.Mesh(conGeo, conMats[Math.floor(Math.random() * palette.length)]!);
          m.position.set(53 + r * 1.3, 0.55 + y * 1.1, -40 + c * 3.2 + (r % 2) * 0.4);
          m.rotation.y = Math.PI / 2;
          yard.add(m);
        }
      }
    scene.add(yard);
    const ship = new THREE.Group();
    ship.add(new THREE.Mesh(keep(new THREE.BoxGeometry(9, 2.2, 46)), keep(new THREE.MeshStandardMaterial({ color: 0x1a1f33, metalness: 0.5, roughness: 0.5 }))));
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(conGeo, conMats[i % palette.length]!);
      m.position.set(-3 + (i % 3) * 3, 1.7 + Math.floor(i / 13) * 1.1, -18 + ((i * 7) % 13) * 3);
      m.rotation.y = Math.PI / 2;
      ship.add(m);
    }
    ship.position.set(76, 1, 0);
    scene.add(ship);
    // Crane
    const craneMat = keep(new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.3 }));
    const crane = new THREE.Group();
    [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(keep(new THREE.BoxGeometry(0.5, 16, 0.5)), craneMat);
      leg.position.set(x!, 8, z!);
      crane.add(leg);
    });
    const boom = new THREE.Mesh(keep(new THREE.BoxGeometry(26, 0.8, 1.2)), craneMat);
    boom.position.set(8, 16, 0);
    crane.add(boom);
    crane.position.set(66, 0, 0);
    scene.add(crane);

    // Tower: 9 big containers, one per agent; the selected one lifts and glows.
    const tower = new THREE.Group();
    tower.position.set(42, 0, -30);
    const towerBox = keep(new THREE.BoxGeometry(5.6, 2.3, 2.4));
    const agentBoxes = Array.from({ length: 9 }, (_, i) => {
      const mat = keep(new THREE.MeshStandardMaterial({ color: i % 2 ? 0x1d2a66 : 0x2a3a88, roughness: 0.5, metalness: 0.3, emissive: BLUE, emissiveIntensity: 0.15 }));
      const m = new THREE.Mesh(towerBox, mat);
      const layer = Math.floor(i / 3), slot = i % 3;
      m.position.set((slot - 1) * 6, 1.15 + layer * 2.4, 0);
      m.userData.baseY = m.position.y;
      const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(towerBox)), keep(new THREE.LineBasicMaterial({ color: 0x6e95ff, transparent: true, opacity: 0.6 })));
      m.add(edges);
      tower.add(m);
      return m;
    });
    scene.add(tower);
    let activeAgent = 0;

    // ── Storm over the highway ───────────────────────────────────────────────
    const storm = new THREE.Group();
    storm.position.set(0, 0, -92);
    scene.add(storm);
    const road = new THREE.Mesh(keep(new THREE.PlaneGeometry(90, 4)), keep(new THREE.MeshStandardMaterial({ color: 0x151a2e })));
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.04;
    storm.add(road);
    const redPts = [new THREE.Vector3(-45, 0.3, 0), new THREE.Vector3(45, 0.3, 0)];
    const redRoute = new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.LineCurve3(redPts[0]!, redPts[1]!), 8, 0.28, 8)), keep(new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.9 })));
    storm.add(redRoute);
    const detour = new THREE.CatmullRomCurve3([new THREE.Vector3(-45, 0.4, 0), new THREE.Vector3(-22, 0.4, 0), new THREE.Vector3(-12, 0.4, 16), new THREE.Vector3(12, 0.4, 18), new THREE.Vector3(22, 0.4, 2), new THREE.Vector3(45, 0.4, 0)]);
    const detourGeo = keep(new THREE.TubeGeometry(detour, 120, 0.34, 8));
    const detourMesh = new THREE.Mesh(detourGeo, keep(new THREE.MeshBasicMaterial({ color: BLUE })));
    detourGeo.setDrawRange(0, 0);
    storm.add(detourMesh);
    const clouds = new THREE.Group();
    const cloudMat = keep(new THREE.MeshStandardMaterial({ color: 0x2a3366, emissive: 0x141a3a, transparent: true, opacity: 0.8, roughness: 1 }));
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Mesh(keep(new THREE.SphereGeometry(3 + Math.random() * 4, 14, 10)), cloudMat);
      c.position.set(-14 + Math.random() * 28, 16 + Math.random() * 3, -8 + Math.random() * 12);
      c.scale.y = 0.45;
      clouds.add(c);
    }
    storm.add(clouds);
    const RAIN = small ? 1200 : 3000;
    const rain = new Float32Array(RAIN * 3);
    for (let i = 0; i < RAIN; i++) rain.set([-18 + Math.random() * 36, Math.random() * 17, -10 + Math.random() * 18], i * 3);
    const rainGeo = keep(new THREE.BufferGeometry());
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rain, 3));
    storm.add(new THREE.Points(rainGeo, keep(new THREE.PointsMaterial({ color: 0x9fb6ff, size: 0.22, transparent: true, opacity: 0.8 }))));
    const bolt = new THREE.PointLight(0xcfdcff, 0, 80);
    bolt.position.set(0, 18, 0);
    storm.add(bolt);
    const blocked = new THREE.Mesh(keep(new THREE.TorusGeometry(2.2, 0.25, 8, 32)), keep(new THREE.MeshBasicMaterial({ color: RED })));
    blocked.rotation.x = -Math.PI / 2;
    blocked.position.set(0, 0.4, 0);
    storm.add(blocked);
    let rerouteAt = -1;

    // ── Events from the page ─────────────────────────────────────────────────
    const onReplan = () =>
      trucks.forEach((t) => {
        const { loop, len } = makeLoop();
        t.loop = loop;
        t.len = len;
        t.flash = 1;
      });
    const onAgent = (e: Event) => (activeAgent = (e as CustomEvent<number>).detail ?? 0);
    const onReroute = () => (rerouteAt = performance.now());
    window.addEventListener(WORLD_EVENT.replan, onReplan);
    window.addEventListener(WORLD_EVENT.agent, onAgent);
    window.addEventListener(WORLD_EVENT.reroute, onReroute);

    // ── Camera stations from the page layout ─────────────────────────────────
    let anchors: { y: number; key: Key }[] = [];
    const measure = () => {
      anchors = [...document.querySelectorAll<HTMLElement>("[data-cam]")]
        .map((s) => {
          const r = s.getBoundingClientRect();
          return { y: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, key: (window.innerWidth < 768 ? CAM_PHONE[s.dataset.cam ?? ""] : undefined) ?? CAM[s.dataset.cam ?? "globe"] ?? CAM.globe! };
        })
        .sort((a, b) => a.y - b.y);
    };
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 768 ? 60 : 45;
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

    const camPos = new THREE.Vector3(...CAM.globe!.p), camLook = new THREE.Vector3(...CAM.globe!.l);
    const tPos = new THREE.Vector3(), tLook = new THREE.Vector3(), tmp = new THREE.Vector3();
    const target = () => {
      const y = window.scrollY;
      if (!anchors.length) return void (tPos.set(...CAM.globe!.p), tLook.set(...CAM.globe!.l));
      let i = 0;
      while (i < anchors.length - 1 && y > anchors[i + 1]!.y) i++;
      const a = anchors[i]!, b = anchors[Math.min(i + 1, anchors.length - 1)]!;
      const t = b === a ? 0 : smooth(Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y))));
      tPos.set(...a.key.p).lerp(tmp.set(...b.key.p), t);
      tLook.set(...a.key.l).lerp(tmp.set(...b.key.l), t);
      // Rise a little mid-flight so moves between stations feel like a sweep, not a slide.
      tPos.y += Math.sin(t * Math.PI) * 10;
    };

    let frame = 0, last = performance.now();
    const clock = new THREE.Clock();
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = still ? 4 : clock.getElapsedTime();
      target();
      camPos.lerp(tPos, still ? 1 : 0.08);
      camLook.lerp(tLook, still ? 1 : 0.08);
      camera.position.copy(camPos).add(tmp.set(mouse.x * 1.5, -mouse.y * 1, 0));
      camera.lookAt(camLook);

      globe.rotation.y = time * 0.05 + 1.9;
      rim.rotation.copy(globe.rotation);
      arcCurves.forEach((c, i) => arcPackets[i]!.position.copy(c.getPoint((time * (0.1 + (i % 4) * 0.03) + i * 0.13) % 1)));

      for (const t of trucks) {
        if (!still) t.s += t.speed * dt;
        at(t, t.s, t.mesh.position);
        at(t, t.s + 0.3, tmp);
        t.mesh.lookAt(tmp);
        t.mesh.rotateY(Math.PI / 2);
        for (let k = 0; k < TRAIL; k++) {
          at(t, t.s - k * 0.55, tmp);
          t.trail.set([tmp.x, 0.45, tmp.z], k * 3);
        }
        (t.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        if (t.flash > 0) {
          t.flash = Math.max(0, t.flash - dt * 0.7);
          (t.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + t.flash * 3;
        }
      }

      agentBoxes.forEach((m, i) => {
        const on = i === activeAgent;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity += ((on ? 1.4 : 0.12) - mat.emissiveIntensity) * 0.12;
        mat.emissive.setHex(on ? RED : BLUE);
        m.position.y += ((m.userData.baseY + (on ? 0.9 : 0)) - m.position.y) * 0.12;
        m.position.x += (((i % 3) - 1) * 6 + (on ? 1.2 : 0) - m.position.x) * 0.12;
      });

      if (!still) {
        for (let i = 0; i < RAIN; i++) {
          let y = rain[i * 3 + 1]! - dt * 22;
          if (y < 0) y = 17;
          rain[i * 3 + 1] = y;
        }
        (rainGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        bolt.intensity = Math.random() < 0.012 ? 900 : bolt.intensity * 0.82;
        clouds.rotation.y = Math.sin(time * 0.1) * 0.05;
      }
      if (rerouteAt > 0) {
        const k = Math.min(1, (performance.now() - rerouteAt) / 1800);
        detourGeo.setDrawRange(0, Math.floor(k * detourGeo.index!.count));
        (redRoute.material as THREE.MeshBasicMaterial).opacity = 0.9 - k * 0.65;
      }
      (blocked.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(time * 6) > 0 ? RED : 0x661020);
      renderer.render(scene, camera);
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      // Skip rendering while real footage fully covers the 3D world.
      if (!document.hidden && document.documentElement.dataset.cover !== "1") draw();
    };
    if (still) {
      draw();
      const onScroll = () => draw();
      window.addEventListener("scroll", onScroll, { passive: true });
      disposables.push({ dispose: () => window.removeEventListener("scroll", onScroll) });
    } else loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener(WORLD_EVENT.replan, onReplan);
      window.removeEventListener(WORLD_EVENT.agent, onAgent);
      window.removeEventListener(WORLD_EVENT.reroute, onReroute);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 [&>canvas]:h-full [&>canvas]:w-full" />;
}
