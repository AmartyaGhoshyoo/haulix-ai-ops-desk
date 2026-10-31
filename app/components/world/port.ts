// The port in a storm: a real aerial photo of a container terminal (Unsplash) raised into 3D,
// rain falling through it, lightning lighting the stacks, the blocked route in red and the
// detour drawn in blue once a person approves it. The same scene, seen from straight above,
// is the ops desk's map with a radar sweep.
import * as THREE from "three";
import { BLUE, RED, type Place } from "./common";
import { createRelief } from "./relief";

export const createPort = async (): Promise<Place & { reroute(): void; setMode(mode: "storm" | "map"): void }> => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);
  const relief = await createRelief("/3d/photo/port.jpg", "/3d/photo/port_depth.png", 60, 3.5, { tint: 0x7d9cff, exposure: 1.05, warm: 0.25, fog: 0x06080f });
  scene.add(relief.mesh);

  const onSurface = (x: number, z: number, lift = 0.5) => new THREE.Vector3(x, relief.depthAt(x, z) + lift, z);

  // The blocked lane (red, dashed) and the detour (blue, drawn on approval).
  const blocked = new THREE.CatmullRomCurve3([onSurface(-26, 6), onSurface(-8, 4.5, 1), onSurface(8, 3, 1), onSurface(26, 1)]);
  const blockedMesh = new THREE.Mesh(new THREE.TubeGeometry(blocked, 120, 0.16, 8), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.95, toneMapped: false }));
  scene.add(blockedMesh);
  const cross = new THREE.Group();
  const bar = new THREE.BoxGeometry(2.2, 0.25, 0.25);
  const barMat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false });
  const b1 = new THREE.Mesh(bar, barMat), b2 = new THREE.Mesh(bar, barMat);
  b1.rotation.z = Math.PI / 4;
  b2.rotation.z = -Math.PI / 4;
  cross.add(b1, b2);
  cross.position.copy(onSurface(0, 3.6, 2.6));
  scene.add(cross);
  const detour = new THREE.CatmullRomCurve3([onSurface(-26, 6), onSurface(-14, -2, 3), onSurface(0, -9, 5), onSurface(14, -6, 3), onSurface(26, 1)]);
  const detourGeo = new THREE.TubeGeometry(detour, 200, 0.2, 8);
  detourGeo.setDrawRange(0, 0);
  scene.add(new THREE.Mesh(detourGeo, new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false })));
  const truck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  scene.add(truck);

  // Rain.
  const RAIN = 5000;
  const rain = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) rain.set([(Math.random() - 0.5) * 70, Math.random() * 30, (Math.random() - 0.5) * 45], i * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rain, 3));
  const rainMat = new THREE.PointsMaterial({ color: 0xbcd0ff, size: 0.09, transparent: true, opacity: 0.75 });
  scene.add(new THREE.Points(rainGeo, rainMat));

  // Radar sweep for the map mode.
  const sweep = new THREE.Mesh(
    new THREE.CircleGeometry(30, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uAngle: { value: 0 }, uOn: { value: 0 } },
      vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uAngle; uniform float uOn; varying vec2 vP;
        void main(){ float a = atan(vP.y, vP.x); float d = mod(uAngle - a, 6.28318);
          float wedge = smoothstep(0.9, 0.0, d) * 0.45; float r = length(vP) / 30.0;
          float rings = smoothstep(0.012, 0.0, abs(fract(r * 4.0) - 0.5) - 0.48) * 0.25;
          gl_FragColor = vec4(0.18, 0.42, 1.0, (wedge + rings) * uOn * (1.0 - r * 0.4)); }`,
    }),
  );
  sweep.rotation.x = -Math.PI / 2;
  sweep.position.y = 5.5;
  scene.add(sweep);

  let detourAt = -1;
  let mode: "storm" | "map" = "storm";
  let flash = 0;
  return {
    scene,
    reroute() {
      if (detourAt < 0) detourAt = performance.now();
    },
    setMode(m) {
      mode = m;
    },
    update(t, dt) {
      const storm = mode === "storm";
      rainMat.opacity += ((storm ? 0.75 : 0) - rainMat.opacity) * 0.08;
      if (storm) {
        for (let i = 0; i < RAIN; i++) {
          let y = rain[i * 3 + 1]! - dt * 26;
          if (y < 0) y = 30;
          rain[i * 3 + 1] = y;
        }
        (rainGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        if (Math.random() < 0.01) flash = 1;
      }
      flash *= 0.86;
      relief.uniforms.uFlash.value = storm ? flash : 0;
      relief.uniforms.uExposure.value = storm ? 0.85 : 1.15;
      const u = sweep.material as THREE.ShaderMaterial;
      u.uniforms.uAngle!.value = t * 1.4;
      u.uniforms.uOn!.value += ((storm ? 0 : 1) - (u.uniforms.uOn!.value as number)) * 0.08;
      cross.rotation.y = t * 1.5;
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      (blockedMesh.material as THREE.MeshBasicMaterial).opacity = detourAt > 0 ? 0.25 : 0.6 + pulse * 0.4;
      if (detourAt > 0) {
        const k = Math.min(1, (performance.now() - detourAt) / 1800);
        detourGeo.setDrawRange(0, Math.floor(k * (detourGeo.index?.count ?? 0)));
        truck.position.copy(detour.getPointAt(k < 1 ? k : (t * 0.06) % 1));
      } else {
        truck.position.copy(blocked.getPointAt(Math.min(0.45, (t * 0.05) % 0.6)));
      }
    },
    dispose() {},
  };
};
