// Fleet: a real night-time motorway interchange (Unsplash) raised into 3D from its depth map.
// Glowing route arcs hop between depots above it, with packets riding them; "Drop in an order"
// re-plans: every arc is rebuilt and the packets flash.
import * as THREE from "three";
import { RED, SOFT, type Place } from "./common";
import { createRelief } from "./relief";

const DEPOTS: [number, number][] = [[-22, -10], [-8, 6], [6, -12], [18, 4], [-16, 12], [12, 13], [24, -9], [-26, 2]];

export const createHighway = async (): Promise<Place & { replan(): void }> => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const relief = await createRelief("/3d/photo/highway.jpg", "/3d/photo/highway_depth.png", 64, 5, { tint: 0x6e95ff, exposure: 1.25, warm: 0.18, fog: 0x05070f });
  scene.add(relief.mesh);

  // Depots: pulsing rings standing on the surface.
  const depotRings = DEPOTS.map(([x, z]) => {
    const y = relief.depthAt(x, z) + 0.2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 48), new THREE.MeshBasicMaterial({ color: RED, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y, z);
    scene.add(ring);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 8), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.6, toneMapped: false }));
    pin.position.set(x, y + 1.5, z);
    scene.add(pin);
    return ring;
  });

  const routes = new THREE.Group();
  scene.add(routes);
  type Route = { curve: THREE.QuadraticBezierCurve3; packet: THREE.Mesh; speed: number; offset: number };
  let list: Route[] = [];
  let flash = 0;
  const build = () => {
    routes.clear();
    list = [];
    const used = new Set<string>();
    for (let k = 0; k < 9; k++) {
      const a = Math.floor(Math.random() * DEPOTS.length), b = Math.floor(Math.random() * DEPOTS.length);
      if (a === b || used.has(`${a}-${b}`)) continue;
      used.add(`${a}-${b}`);
      const [ax, az] = DEPOTS[a]!, [bx, bz] = DEPOTS[b]!;
      const A = new THREE.Vector3(ax, relief.depthAt(ax, az) + 0.3, az);
      const B = new THREE.Vector3(bx, relief.depthAt(bx, bz) + 0.3, bz);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      mid.y += 4 + A.distanceTo(B) * 0.25;
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      const red = k % 3 === 0;
      routes.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.06, 6, false), new THREE.MeshBasicMaterial({ color: red ? RED : SOFT, transparent: true, opacity: 0.9, toneMapped: false })));
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
      routes.add(packet);
      list.push({ curve, packet, speed: 0.12 + Math.random() * 0.12, offset: Math.random() });
    }
  };
  build();

  return {
    scene,
    replan() {
      build();
      flash = 1;
    },
    update(t, dt) {
      flash = Math.max(0, flash - dt * 0.8);
      relief.uniforms.uFlash.value = flash * 0.35;
      for (const r of list) {
        r.packet.position.copy(r.curve.getPoint((t * r.speed + r.offset) % 1));
        r.packet.scale.setScalar(1 + flash * 1.5);
      }
      depotRings.forEach((ring, i) => {
        const s = 1 + ((t * 0.8 + i * 0.3) % 1) * 1.6;
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity = 1 - (s - 1) / 1.6;
      });
    },
    dispose() {},
  };
};
