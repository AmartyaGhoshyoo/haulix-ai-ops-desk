"use client";

// A 3D dot-globe with real logistics hubs and glowing shipment arcs; packets travel along
// the arcs. `focus` (0–1 scroll progress) turns the globe toward the featured lane.
// Pauses off-screen; a still frame under reduced motion.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { LAND } from "../data/land";

const HUBS: [string, number, number][] = [
  ["Dhaka", 23.8, 90.4],
  ["Chittagong", 22.3, 91.8],
  ["Kolkata", 22.6, 88.4],
  ["Mumbai", 19.1, 72.9],
  ["Dubai", 25.2, 55.3],
  ["Singapore", 1.35, 103.8],
  ["Colombo", 6.9, 79.9],
  ["Shenzhen", 22.5, 114.1],
  ["Rotterdam", 51.9, 4.5],
  ["Hamburg", 53.5, 10.0],
  ["New York", 40.7, -74.0],
  ["Los Angeles", 34.0, -118.2],
  ["Nairobi", -1.3, 36.8],
  ["Sydney", -33.9, 151.2],
];
const LANES: [number, number][] = [
  [1, 8], [0, 2], [7, 0], [3, 4], [1, 6], [6, 8], [5, 9], [7, 11], [8, 10], [4, 12], [5, 13], [0, 5],
];

const R = 2;
function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export default function Globe({ focus, className = "" }: { focus?: MotionValue<number>; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const focusRef = useRef(focus);
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  useEffect(() => {
    const el = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7);
    const world = new THREE.Group();
    scene.add(world);

    // Land as dots (Natural Earth), over a dark ocean sphere with a soft yellow rim glow.
    const dots = new Float32Array(LAND.length * 1.5);
    for (let i = 0; i < LAND.length; i += 2) dots.set(toVec(LAND[i]!, LAND[i + 1]!, R * 1.003).toArray(), i * 1.5);
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dots, 3));
    world.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: 0xc9ced6, size: 0.034, transparent: true, opacity: 0.85 })));
    world.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), new THREE.MeshBasicMaterial({ color: 0x181c23 })));
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "varying vec3 vN; void main(){ float i = pow(clamp(-vN.z, 0.0, 1.0), 1.5) * 1.1; gl_FragColor = vec4(1.0, 0.82, 0.25, 1.0) * i; }",
      }),
    );
    scene.add(rim);

    // Hubs
    const hubPos = HUBS.map(([, lat, lng]) => toVec(lat, lng));
    hubPos.forEach((p) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      m.position.copy(p);
      world.add(m);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      world.add(ring);
    });

    // Arcs + packets
    const curves = LANES.map(([a, b]) => {
      const A = hubPos[a]!, B = hubPos[b]!;
      const mid = A.clone().add(B).multiplyScalar(0.5);
      const lift = 1 + A.distanceTo(B) * 0.28;
      return new THREE.QuadraticBezierCurve3(A, mid.normalize().multiplyScalar(R * lift), B);
    });
    curves.forEach((c, i) => {
      const g = new THREE.BufferGeometry().setFromPoints(c.getPoints(64));
      world.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: i === 0 ? 0xffd23f : 0xf5f5f0, transparent: true, opacity: i === 0 ? 0.95 : 0.35 })));
    });
    const packets = curves.map((_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.05 : 0.03, 10, 10), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffd23f : 0xffffff }));
      world.add(m);
      return m;
    });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Keep the whole globe (plus glow) in frame whatever the box shape.
      const half = Math.tan(((camera.fov / 2) * Math.PI) / 180);
      camera.position.z = (R * 1.3) / (half * Math.min(1, camera.aspect));
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? true));
    io.observe(el);
    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Rotation that brings the featured lane (Chittagong → Rotterdam) to the front.
    const laneMid = hubPos[1]!.clone().add(hubPos[8]!).normalize();
    const frontY = Math.atan2(laneMid.x, laneMid.z);

    let frame = 0;
    const clock = new THREE.Clock();
    const draw = () => {
      const t = still ? 6 : clock.getElapsedTime();
      const f = focusRef.current?.get() ?? 0;
      const spin = Math.sin(t * 0.05) * 1.1;
      // Start facing the featured lane, then drift slowly east; `focus` pulls it back to the lane.
      world.rotation.y = frontY + spin * (1 - f) + mouse.x * 0.15;
      world.rotation.x = 0.25 + mouse.y * 0.08;
      curves.forEach((c, i) => packets[i]!.position.copy(c.getPoint(((t * (0.12 + (i % 4) * 0.03)) + i * 0.17) % 1)));
      renderer.render(scene, camera);
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (visible) draw();
    };
    if (still) draw();
    else loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} aria-hidden="true" className={`[&>canvas]:h-full [&>canvas]:w-full ${className}`} />;
}
