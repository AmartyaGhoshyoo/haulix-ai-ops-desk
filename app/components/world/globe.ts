// The Earth from orbit: NASA day/night textures (via the three.js examples, public domain),
// clouds, an atmosphere rim, city lights on the night side, and live shipping lanes.
import * as THREE from "three";
import { BLUE, RED, SOFT, loadTexture, type Place } from "./common";

const R = 2;
const toVec = (lat: number, lng: number, r = R) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};
const HUBS: [number, number][] = [
  [22.3, 91.8], [51.9, 4.5], [1.35, 103.8], [25.2, 55.3], [40.7, -74], [22.5, 114.1],
  [19.1, 72.9], [6.9, 79.9], [34, -118.2], [-33.9, 151.2], [23.8, 90.4], [53.5, 10],
];
const LANES = [[0, 1], [0, 2], [2, 5], [3, 1], [6, 3], [4, 1], [5, 8], [2, 9], [7, 1], [10, 6], [11, 4], [0, 7]];

const earthVertex = /* glsl */ `
  varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vPosW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const earthFragment = /* glsl */ `
  uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uClouds;
  uniform vec3 uSun; uniform float uTime;
  varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    float light = dot(n, normalize(uSun));
    float day = smoothstep(-0.18, 0.28, light);
    vec3 dayCol = texture2D(uDay, vUv).rgb;
    vec3 nightCol = texture2D(uNight, vUv).rgb * vec3(1.0, 0.85, 0.7) * 1.6;
    float clouds = texture2D(uClouds, vUv + vec2(uTime * 0.002, 0.0)).b;
    vec3 col = mix(nightCol, dayCol * (0.35 + 0.9 * max(light, 0.0)), day);
    col = mix(col, vec3(1.0) * (0.15 + 0.85 * day), clouds * 0.75);
    // A cool grade toward the site's blue, and a specular glint on the oceans.
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
    col += vec3(0.18, 0.42, 1.0) * rim * 0.9;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export const createGlobe = async (): Promise<Place> => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const [day, night, clouds] = await Promise.all([
    loadTexture("/3d/earth/day.jpg"),
    loadTexture("/3d/earth/night.jpg"),
    loadTexture("/3d/earth/clouds.jpg", false),
  ]);
  clouds.wrapS = THREE.RepeatWrapping;
  const uniforms = { uDay: { value: day }, uNight: { value: night }, uClouds: { value: clouds }, uSun: { value: new THREE.Vector3(-1, 0.35, 0.6) }, uTime: { value: 0 } };
  const world = new THREE.Group();
  world.rotation.z = 0.41; // axial tilt
  scene.add(world);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 128), new THREE.ShaderMaterial({ uniforms, vertexShader: earthVertex, fragmentShader: earthFragment }));
  world.add(earth);

  // Atmosphere: a soft blue halo just outside the surface.
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.08, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 vN; void main(){ float i = pow(clamp(-vN.z, 0.0, 1.0), 2.2); gl_FragColor = vec4(0.2, 0.45, 1.0, 1.0) * i * 1.3; }",
    }),
  );
  scene.add(halo);

  // Lanes and travelling packets.
  const curves = LANES.map(([a, b]) => {
    const A = toVec(...HUBS[a]!), B = toVec(...HUBS[b]!);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    return new THREE.QuadraticBezierCurve3(A, mid.normalize().multiplyScalar(R * (1 + A.distanceTo(B) * 0.2)), B);
  });
  curves.forEach((c, i) => {
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(80)), new THREE.LineBasicMaterial({ color: i % 4 === 0 ? RED : SOFT, transparent: true, opacity: 0.85, toneMapped: false })));
  });
  const packets = curves.map((_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0xffc2cc : 0xdbe6ff, toneMapped: false }));
    world.add(m);
    return m;
  });
  HUBS.forEach((h) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false }));
    m.position.copy(toVec(...h, R * 1.002));
    world.add(m);
  });

  // Stars.
  const N = 2400;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) pos.set(new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 40).toArray(), i * 3);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 })));

  return {
    scene,
    update(t) {
      uniforms.uTime.value = t;
      world.rotation.y = 2.2 + t * 0.03; // start over the Indian Ocean, drift east
      halo.position.copy(earth.position);
      curves.forEach((c, i) => packets[i]!.position.copy(c.getPoint((t * (0.08 + (i % 4) * 0.02) + i * 0.13) % 1)));
    },
    dispose() {},
  };
};
