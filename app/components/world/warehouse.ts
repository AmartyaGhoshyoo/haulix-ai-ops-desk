// The control tower: a real 3D warehouse. Every prop is a CC0 Poly Haven model (steel shelving,
// boxes, crates, barrels, overhead crane, hand trucks, roller-shutter doors, lamps) lit by a real
// warehouse HDRI. Robots run on glowing lanes; picking an agent lights up its bay in red.
import * as THREE from "three";
import { BLUE, RED, SOFT, fit, loadHDR, loadModel, loadTexture, type Place } from "./common";

const M = "/3d/models/";

export const createWarehouse = async (renderer: THREE.WebGLRenderer): Promise<Place & { setAgent(i: number): void; replan(): void }> => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090f);
  scene.fog = new THREE.Fog(0x07090f, 18, 46);

  const [env, shelf, box, crate, plastic, barrel, crane, truck, door, lamp, diff, nor, rough] = await Promise.all([
    loadHDR("/3d/tex/warehouse.hdr", renderer),
    loadModel(M + "steel_frame_shelves_01.glb"),
    loadModel(M + "cardboard_box_01.glb"),
    loadModel(M + "wooden_crate_01.glb"),
    loadModel(M + "plastic_crate_01.glb"),
    loadModel(M + "Barrel_01.glb"),
    loadModel(M + "overhead_crane.glb"),
    loadModel(M + "hand_truck.glb"),
    loadModel(M + "rollershutter_door.glb"),
    loadModel(M + "hanging_industrial_lamp.glb"),
    loadTexture("/3d/tex/concrete_diff.jpg"),
    loadTexture("/3d/tex/concrete_nor_gl.jpg", false),
    loadTexture("/3d/tex/concrete_rough.jpg", false),
  ]);
  scene.environment = env;
  scene.environmentIntensity = 0.9;

  // Floor and walls.
  for (const t of [diff, nor, rough]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 5);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 28), new THREE.MeshStandardMaterial({ map: diff, normalMap: nor, roughnessMap: rough, color: 0x9aa3b5, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(44, 12), wallMat);
  back.position.set(0, 6, -14);
  scene.add(back);

  // Prototypes, normalised to real-world sizes (metres).
  const P = {
    shelf: fit(shelf, 2.6),
    box: fit(box, 0.42),
    crate: fit(crate, 0.7),
    plastic: fit(plastic, 0.32),
    barrel: fit(barrel, 0.95),
    crane: fit(crane, 30, "x"),
    truck: fit(truck, 1.25),
    door: fit(door, 5.5),
    lamp: fit(lamp, 0.7),
  };
  const shelfSize = new THREE.Box3().setFromObject(P.shelf).getSize(new THREE.Vector3());
  const clone = (proto: THREE.Object3D) => proto.clone(true);

  // Three aisles of shelving; each run of shelves is one "bay" an agent owns. Bay 0 is the
  // front-right one so the first highlighted bay is in view beside the panel.
  const bays: { light: THREE.SpotLight; outline: THREE.LineSegments }[] = [];
  const shelfLevels = [0.12, 0.95, 1.78];
  const PER = 4;
  const spacing = PER * shelfSize.x * 1.02 + 3.2;
  for (const z of [3, -2.5, -8]) {
    for (const k of [1, 0, -1]) {
      const bayIndex = bays.length;
      const group = new THREE.Group();
      for (let s = 0; s < PER; s++) {
        const unit = clone(P.shelf);
        unit.position.x = (s - (PER - 1) / 2) * shelfSize.x * 1.02;
        group.add(unit);
        // Goods on every level.
        for (const y of shelfLevels) {
          for (let n = -1; n <= 1; n++) {
            const r = (bayIndex * 7 + s * 3 + n * 5 + Math.round(y * 10)) % 5;
            const item = clone(r === 2 ? P.plastic : r === 3 ? P.crate : P.box);
            item.position.set(unit.position.x + n * shelfSize.x * 0.28, y, (r % 2 ? 0.05 : -0.05) * shelfSize.z);
            item.rotation.y = (r - 2) * 0.12;
            if (r === 3) item.scale.multiplyScalar(0.62);
            group.add(item);
          }
        }
      }
      group.position.set(k * spacing, 0, z);
      scene.add(group);
      const bb = new THREE.Box3().setFromObject(group).expandByScalar(0.08);
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...bb.getSize(new THREE.Vector3()).toArray())), new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0, toneMapped: false }));
      outline.position.copy(bb.getCenter(new THREE.Vector3()));
      scene.add(outline);
      const light = new THREE.SpotLight(RED, 0, 16, 0.55, 0.6, 1.2);
      light.position.set(group.position.x, 8, z + 3);
      light.target.position.set(group.position.x, 0.8, z);
      scene.add(light, light.target);
      bays.push({ light, outline });
    }
  }

  // Overhead crane across the hall, barrels and hand trucks along the walls, doors at the back.
  const craneObj = clone(P.crane);
  craneObj.position.set(0, 0, -11.5);
  scene.add(craneObj);
  for (let i = 0; i < 6; i++) {
    const b = clone(P.barrel);
    b.position.set(-19 + (i % 3) * 0.9, 0, -12 + Math.floor(i / 3) * 0.95);
    scene.add(b);
  }
  [[-16, 9], [15, 9.5], [8, -12]].forEach(([x, z]) => {
    const t = clone(P.truck);
    t.position.set(x!, 0, z!);
    t.rotation.y = x! * 0.1;
    scene.add(t);
  });
  [-12, 0, 12].forEach((x) => {
    const d = clone(P.door);
    d.position.set(x, 0, -13.9);
    scene.add(d);
  });

  // Hanging lamps with real light.
  scene.add(new THREE.HemisphereLight(0x8fb0ff, 0x0b0d14, 0.35));
  [[-12, -4], [0, -4], [12, -4], [-6, 8], [6, 8]].forEach(([x, z], i) => {
    const l = clone(P.lamp);
    l.position.set(x!, 8.2, z!);
    scene.add(l);
    if (i < 4) {
      const p = new THREE.PointLight(0xdfe6ff, 70, 22, 1.4);
      p.position.set(x!, 7.6, z!);
      scene.add(p);
    }
  });

  // Robots on glowing floor lanes.
  const lanes = [
    new THREE.CatmullRomCurve3([[-18, 0.03, -4], [-6, 0.03, -4], [6, 0.03, -4], [18, 0.03, -4], [18, 0.03, 2], [-18, 0.03, 2]].map((p) => new THREE.Vector3(...(p as [number, number, number]))), true),
    new THREE.CatmullRomCurve3([[-18, 0.03, 8.5], [0, 0.03, 8.5], [18, 0.03, 8.5], [18, 0.03, 11], [-18, 0.03, 11]].map((p) => new THREE.Vector3(...(p as [number, number, number]))), true),
  ];
  const laneMats = lanes.map((c, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: i ? RED : BLUE, transparent: true, opacity: 0.75, toneMapped: false });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 240, 0.05, 4, true), mat));
    return mat;
  });
  const robotGeo = new THREE.BoxGeometry(0.9, 0.35, 0.6);
  const robots = Array.from({ length: 8 }, (_, i) => {
    const body = new THREE.Mesh(robotGeo, new THREE.MeshStandardMaterial({ color: 0xe9edf5, metalness: 0.3, roughness: 0.35 }));
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.62), new THREE.MeshBasicMaterial({ color: i % 2 ? RED : SOFT, toneMapped: false }));
    strip.position.y = 0.2;
    body.add(strip);
    body.position.y = 0.2;
    scene.add(body);
    return { body, lane: lanes[i % 2]!, offset: i / 8, speed: 0.025 + (i % 3) * 0.006 };
  });

  let active = 0;
  let replanFlash = 0;
  return {
    scene,
    setAgent(i) {
      active = i;
    },
    replan() {
      replanFlash = 1;
      robots.forEach((r) => (r.offset = Math.random()));
    },
    update(t, dt) {
      replanFlash = Math.max(0, replanFlash - dt);
      laneMats.forEach((m) => (m.opacity = 0.55 + 0.4 * Math.sin(t * 2) * 0.5 + replanFlash * 0.4));
      for (const r of robots) {
        const u = (t * r.speed + r.offset) % 1;
        const p = r.lane.getPointAt(u);
        const q = r.lane.getPointAt((u + 0.002) % 1);
        r.body.position.set(p.x, 0.2, p.z);
        r.body.lookAt(q.x, 0.2, q.z);
      }
      bays.forEach((b, i) => {
        const on = i === active;
        b.light.intensity += ((on ? 420 : 0) - b.light.intensity) * 0.1;
        const m = b.outline.material as THREE.LineBasicMaterial;
        m.opacity += ((on ? 1 : 0) - m.opacity) * 0.12;
      });
    },
    dispose() {},
  };
};
