"use client";

// One fixed HD Earth behind the whole page. 8K NASA-derived day and night maps (Solar System Scope,
// CC BY 4.0), an ocean mask for sun glint and flowing water, two drifting cloud shells, a blue
// atmosphere, stars, and Haulix's live network: pulsing hubs at real ports and airports joined by
// glowing lanes. Bloom and a soft corner nebula finish it. As you scroll, the planet rises huge
// and low behind the hero, then zooms out and swings left → right → centre, turning as it goes.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const R = 1.95;
const TILT = 0.36;
const INIT_ROT = -1.35; // brings South Asia round to face the camera at the top of the page
const SUN = new THREE.Vector3(-0.85, 0.3, 0.55).normalize();

// Scroll keyframes for the whole world (x, y, scale), smoothstepped between stops.
const STOPS_X = [{ p: 0, v: 0 }, { p: 0.3, v: -3.0 }, { p: 0.62, v: 3.1 }, { p: 1, v: 0 }];
const STOPS_Y = [{ p: 0, v: -4.75 }, { p: 0.3, v: 0.45 }, { p: 0.62, v: 0.35 }, { p: 1, v: 0.1 }];
const STOPS_S = [{ p: 0, v: 2.1 }, { p: 0.3, v: 1.0 }, { p: 0.62, v: 0.92 }, { p: 1, v: 1.1 }];
const sample = (stops: { p: number; v: number }[], p: number) => {
  if (p <= stops[0]!.p) return stops[0]!.v;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!, b = stops[i]!;
    if (p <= b.p) {
      const t = (p - a.p) / (b.p - a.p);
      return a.v + (b.v - a.v) * t * t * (3 - 2 * t);
    }
  }
  return stops[stops.length - 1]!.v;
};

// Hubs: [lat, lng] of real ports and air hubs Haulix routes through.
const HUBS: [number, number][] = [
  [22.33, 91.8], [23.81, 90.41], [22.57, 88.36], [19.08, 72.88], [25.27, 55.3], [1.29, 103.85], [22.3, 114.17], [31.23, 121.47],
  [35.68, 139.69], [51.95, 4.14], [53.55, 9.99], [51.5, -0.12], [40.71, -74.0], [33.74, -118.27], [-33.86, 151.2], [6.93, 79.85],
  [30.04, 31.24], [-23.96, -46.33], [29.76, -95.36], [13.75, 100.5], [41.01, 28.97], [24.86, 67.0], [-33.92, 18.42], [37.57, 126.98],
];
const LANES = [[0, 9], [0, 5], [1, 4], [5, 6], [6, 7], [7, 8], [9, 12], [10, 11], [4, 16], [16, 9], [5, 14], [3, 4], [2, 5], [6, 13], [12, 18], [17, 9], [19, 5], [20, 10], [21, 4], [22, 9], [23, 8], [15, 0]];
const HOT = new Set([2, 8, 14]); // lanes with an open exception glow red

const toVec = (lat: number, lng: number, r: number) => {
  const phi = ((90 - lat) * Math.PI) / 180, theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

const NOISE = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){ const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy); vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i); vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0)); vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }`;

const earthVertex = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vPos;
  void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vPos = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const earthFragment = /* glsl */ `
  uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uOcean; uniform sampler2D uClouds;
  uniform vec3 uSun; uniform float uTime;
  varying vec2 vUv; varying vec3 vN; varying vec3 vPos;
  ${NOISE}
  void main(){
    vec3 n = normalize(vN); vec3 V = normalize(cameraPosition - vPos);
    vec3 day = texture2D(uDay, vUv).rgb;
    float ocean = smoothstep(0.25, 0.75, texture2D(uOcean, vUv).r);
    // Terrain relief from the day map's brightness (land only).
    float h = dot(day, vec3(0.299, 0.587, 0.114));
    vec3 dpx = dFdx(vPos), dpy = dFdy(vPos); vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
    vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
    vec3 nb = normalize(abs(det) * n - 0.35 * grad * (1.0 - ocean));
    float ndl = dot(n, uSun);
    float dayAmt = smoothstep(-0.12, 0.32, ndl);
    float lit = clamp(dot(nb, uSun), 0.0, 1.0);
    vec3 col = day * (0.05 + 1.25 * lit);
    // Water: deeper blue, flowing shimmer, sun glint.
    float t = uTime * 0.6;
    float flow = snoise(vec3(vUv * vec2(90.0, 45.0) + vec2(t * 0.3, -t * 0.2), t * 0.4));
    col += ocean * flow * 0.012 * dayAmt;
    col = mix(col, col * vec3(0.6, 0.8, 1.05), ocean * 0.35);
    vec3 H = normalize(uSun + V);
    float ripple = snoise(vec3(vUv * 600.0, uTime * 2.0)) * 0.015;
    float glint = pow(max(dot(n, H) + ripple, 0.0), 160.0);
    col += glint * ocean * dayAmt * vec3(1.0, 0.95, 0.85) * 1.6;
    // Cloud shadows on the ground.
    float cs = texture2D(uClouds, vUv + vec2(uTime * 0.0012 - 0.004, 0.002)).r;
    col *= 1.0 - cs * 0.4 * dayAmt;
    // Night side: city lights.
    float nightAmt = smoothstep(0.12, -0.28, ndl);
    col = mix(col, col * 0.03, nightAmt);
    vec3 lights = texture2D(uNight, vUv).rgb;
    col += lights * vec3(1.0, 0.78, 0.5) * 2.6 * nightAmt * (1.0 - ocean * 0.9);
    // Atmosphere rim.
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.6);
    col += vec3(0.32, 0.55, 1.0) * rim * (0.15 + 0.85 * dayAmt) * 1.1;
    gl_FragColor = vec4(col, 1.0);
  }`;

const cloudFragment = /* glsl */ `
  uniform sampler2D uClouds; uniform vec3 uSun; uniform float uTime; uniform float uOpacity; uniform vec2 uShift;
  varying vec2 vUv; varying vec3 vN; varying vec3 vPos;
  void main(){
    vec3 n = normalize(vN); vec3 V = normalize(cameraPosition - vPos);
    float c = texture2D(uClouds, vUv + uShift).r;
    c = smoothstep(0.12, 0.9, c);
    float ndl = dot(n, uSun);
    float light = smoothstep(-0.25, 0.4, ndl);
    float edge = pow(1.0 - max(dot(n, V), 0.0), 2.0);
    vec3 col = mix(vec3(0.02, 0.03, 0.06), vec3(1.0), light) + vec3(0.2, 0.35, 0.8) * edge * light * 0.3;
    gl_FragColor = vec4(col, c * uOpacity * (0.25 + 0.75 * light));
  }`;

export default function Planet() {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    camera.position.set(0, 0, 8);

    const big = renderer.capabilities.maxTextureSize >= 8192 && window.innerWidth >= 900;
    const loader = new THREE.TextureLoader();
    const tex = (url: string, srgb = true) =>
      loader.loadAsync(url).then((t) => {
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        t.wrapS = THREE.RepeatWrapping;
        return t;
      });

    const world = new THREE.Group(); // only ever moved and scaled by scroll
    const planet = new THREE.Group(); // tilt + turn
    planet.rotation.z = TILT;
    world.add(planet);
    scene.add(world);

    const uniforms = {
      uDay: { value: null as THREE.Texture | null }, uNight: { value: null as THREE.Texture | null }, uOcean: { value: null as THREE.Texture | null },
      uClouds: { value: null as THREE.Texture | null }, uSun: { value: SUN }, uTime: { value: 0 },
    };
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 256, 192), new THREE.ShaderMaterial({ uniforms, vertexShader: earthVertex, fragmentShader: earthFragment }));
    earth.visible = false;
    planet.add(earth);

    // Two cloud shells at different heights, drifting at different speeds.
    const clouds = [
      { h: 1.008, o: 0.85, speed: 0.0018, shift: new THREE.Vector2() },
      { h: 1.022, o: 0.35, speed: 0.0031, shift: new THREE.Vector2(0.37, 0.01) },
    ].map((c) => {
      const u = { uClouds: uniforms.uClouds, uSun: uniforms.uSun, uTime: uniforms.uTime, uOpacity: { value: c.o }, uShift: { value: c.shift } };
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(R * c.h, 192, 128),
        new THREE.ShaderMaterial({ uniforms: u, vertexShader: earthVertex, fragmentShader: cloudFragment, transparent: true, depthWrite: false }),
      );
      m.visible = false;
      planet.add(m);
      return { ...c, m };
    });

    // Atmosphere: a back-side glow shell plus a soft billboard halo.
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 96, 64),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uSun: { value: SUN } },
        vertexShader: "varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }",
        fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
          void main(){ vec3 V = normalize(cameraPosition - vW); float f = pow(clamp(0.72 + dot(vN, V), 0.0, 1.0), 5.0);
            float day = 0.35 + 0.65 * smoothstep(-0.4, 0.6, dot(-vN, -uSun));
            gl_FragColor = vec4(vec3(0.25, 0.5, 1.0) * f * 1.6 * day, f); }`,
      }),
    );
    world.add(atmo);
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: "varying vec2 vUv; void main(){ float d = length(vUv-0.5)*2.0; float a = pow(clamp(1.0-d,0.0,1.0), 2.4); gl_FragColor = vec4(vec3(0.16,0.33,1.0)*a*0.9, a); }",
      }),
    );
    halo.scale.setScalar(R * 2.5);
    halo.renderOrder = -1;
    world.add(halo);

    // Network: hubs (pings) and lanes (light running along arcs) ride on the planet.
    const hubGeo = new THREE.BufferGeometry();
    hubGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(HUBS.flatMap(([a, b]) => toVec(a, b, R * 1.004).toArray())), 3));
    hubGeo.setAttribute("seed", new THREE.BufferAttribute(new Float32Array(HUBS.map(() => Math.random())), 1));
    const hubMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: 26 }, uH: { value: 900 } },
      vertexShader: `attribute float seed; uniform float uSize; uniform float uH; varying float vSeed; varying float vFade;
        void main(){ vSeed = seed; vec4 mv = modelViewMatrix*vec4(position,1.0);
          vec3 vn = normalize(normalMatrix*normalize(position)); vFade = smoothstep(0.1, 0.45, dot(vn, normalize(-mv.xyz)));
          gl_PointSize = max(uSize * uH / 900.0 * (7.0 / max(-mv.z, 1.0)), 2.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform float uTime; varying float vSeed; varying float vFade;
        void main(){ if (vFade < 0.01) discard; float d = length(gl_PointCoord-0.5)*2.0; if (d > 1.0) discard;
          float core = smoothstep(0.28, 0.0, d); float ph = fract(uTime*0.45 + vSeed);
          float ring = smoothstep(0.08, 0.0, abs(d-ph)) * (1.0-ph);
          gl_FragColor = vec4(vec3(0.55,0.75,1.0)*(core*1.6) + vec3(0.3,0.5,1.0)*ring, clamp(core+ring,0.0,1.0)*vFade); }`,
    });
    planet.add(new THREE.Points(hubGeo, hubMat));
    const laneMat = (hot: boolean) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: uniforms.uTime, uCol: { value: new THREE.Color(hot ? 0xff3b5c : 0x5f8bff) }, uSeed: { value: Math.random() } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: `uniform float uTime; uniform vec3 uCol; uniform float uSeed; varying vec2 vUv;
          void main(){ float head = fract(uTime*0.22 + uSeed); float d = head - vUv.x; if (d < 0.0) d += 1.0;
            float tail = exp(-d*7.0); float base = 0.18; float ends = smoothstep(0.0,0.04,vUv.x)*smoothstep(1.0,0.96,vUv.x);
            gl_FragColor = vec4(uCol*(base + tail*2.2), (base + tail)*ends); }`,
      });
    LANES.forEach(([a, b], i) => {
      const A = toVec(...HUBS[a]!, R * 1.004), B = toVec(...HUBS[b]!, R * 1.004);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      const lift = 1 + A.distanceTo(B) * 0.18;
      const curve = new THREE.QuadraticBezierCurve3(A, mid.normalize().multiplyScalar(R * lift), B);
      planet.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.0065, 6, false), laneMat(HOT.has(i))));
    });

    // Stars.
    const N = 2200;
    const sp = new Float32Array(N * 3), sb = new Float32Array(N), ss = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      new THREE.Vector3().randomDirection().multiplyScalar(90).toArray(sp, i * 3);
      sb[i] = 0.3 + Math.random() * 0.7;
      ss[i] = Math.random() * 6.28;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute("bright", new THREE.BufferAttribute(sb, 1));
    starGeo.setAttribute("seed", new THREE.BufferAttribute(ss, 1));
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uH: { value: 900 } },
      vertexShader: `attribute float bright; attribute float seed; uniform float uTime; uniform float uH; varying float vB;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vB = bright*(0.6+0.4*sin(uTime*1.3+seed));
          gl_PointSize = max(1.5*uH/900.0*(90.0/max(-mv.z,1.0)), 1.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: "varying float vB; void main(){ float d = length(gl_PointCoord-0.5); if (d>0.5) discard; gl_FragColor = vec4(vec3(0.82,0.88,1.0), smoothstep(0.5,0.0,d)*vB); }",
    });
    const stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    // Post: bloom, then a deep-space background with a soft blue/red nebula in two corners.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.55, 0.62);
    composer.addPass(bloom);
    const finish = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: /* glsl */ `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
        vec3 warp(vec3 p, float t){ float c=.8,a=1.9,b=.6; p*=2.; p.x+=c*sin(t+a*p.y)+t*b; p.y+=c*cos(t+a*p.x); p.y+=c*sin(t+a*p.z)+t*b; p.z+=c*cos(t+a*p.y); p.z+=c*sin(t+a*p.x)+t*b; p.x+=c*cos(t+a*p.z); return .5+.5*cos(p+vec3(1,2,4)); }
        void main(){ vec2 uv = vUv*2.0-1.0; vec3 s = texture2D(tDiffuse, vUv).rgb;
          vec3 w = pow(warp(vec3(uv.x, sin(uv.y), uv.y), uTime*0.35), vec3(1.6));
          vec3 neb = vec3(0.12,0.3,1.0)*w.x*w.y + vec3(0.9,0.2,0.35)*w.z*0.35;
          neb *= smoothstep(0.3, 1.0, abs(uv.y)) * pow(smoothstep(-0.6, 1.0, -uv.x*uv.y), 2.0);
          vec3 bg = vec3(0.012,0.02,0.055) * (1.0 - 0.45*length(uv));
          gl_FragColor = vec4(s + bg + neb*0.14, 1.0); }`,
    });
    composer.addPass(finish);
    composer.addPass(new OutputPass());

    // Load the maps (8K on desktops that support it, 4K on phones).
    const k = big ? "8k" : "4k";
    let entryStart = -1;
    Promise.all([tex(`/earth/day_${k}.jpg`), tex(`/earth/night_${k}.jpg`), tex("/earth/ocean_4k.jpg", false), tex("/earth/clouds_4k.jpg", false)]).then(([d, n, o, c]) => {
      uniforms.uDay.value = d;
      uniforms.uNight.value = n;
      uniforms.uOcean.value = o;
      uniforms.uClouds.value = c;
      earth.visible = true;
      clouds.forEach((cl) => (cl.m.visible = true));
      entryStart = performance.now();
      document.documentElement.dataset.planet = "ready";
    });

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.resolution.set(w, h);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 52 : 40;
      camera.updateProjectionMatrix();
      hubMat.uniforms.uH!.value = h;
      starMat.uniforms.uH!.value = h;
    };
    resize();
    window.addEventListener("resize", resize);

    let curP = 0, cx = STOPS_X[0]!.v, cy = STOPS_Y[0]!.v, cs = STOPS_S[0]!.v, spin = 0, last = performance.now(), frame = 0;
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pT = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
      curP += (pT - curP) * (still ? 1 : Math.min(1, dt * 4.5));
      const side = Math.min(1, Math.max(0.35, window.innerWidth / 1200));
      const kk = still ? 1 : Math.min(1, dt * 3.2);
      cx += (sample(STOPS_X, curP) * side - cx) * kk;
      cy += (sample(STOPS_Y, curP) - cy) * kk;
      cs += (sample(STOPS_S, curP) - cs) * kk;
      let entry = 0;
      if (entryStart > 0 && !still) {
        const t = Math.min(1, (now - entryStart) / 1900);
        entry = -6.5 * Math.pow(1 - t, 3);
      }
      world.position.set(cx, cy + entry, 0);
      world.scale.setScalar(cs);
      if (!still) spin += dt * 0.025;
      planet.rotation.y = INIT_ROT + spin + curP * Math.PI * 1.4;
      halo.quaternion.copy(camera.quaternion);
      uniforms.uTime.value += dt;
      clouds.forEach((c) => (c.m.rotation.y += dt * c.speed * 6));
      hubMat.uniforms.uTime!.value += dt;
      starMat.uniforms.uTime!.value += dt;
      finish.uniforms.uTime!.value += dt;
      composer.render();
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!document.hidden) draw();
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={host} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 block h-screen w-screen" />;
}
