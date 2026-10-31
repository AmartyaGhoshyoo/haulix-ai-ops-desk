// A real aerial photo turned into true 3D: the image is laid on a dense plane and every vertex is
// pushed up by a depth map estimated from the photo (Depth-Anything V2). Flyovers become ribbons,
// containers become blocks, and the camera can fly over them. The colour is graded into the
// site's midnight / electric-blue palette in the shader.
import * as THREE from "three";
import { loadTexture } from "./common";

const vertex = /* glsl */ `
  uniform sampler2D uDepth; uniform float uLift; uniform vec2 uTexel;
  varying vec2 vUv; varying float vH; varying float vSteep; varying vec3 vPosW;
  void main() {
    vUv = uv;
    float d = texture2D(uDepth, uv).r;
    vH = d;
    // How steep the surface is here: depth edges stretch the photo into streaks, so we hide them.
    float dx = texture2D(uDepth, uv + vec2(uTexel.x, 0.0)).r - texture2D(uDepth, uv - vec2(uTexel.x, 0.0)).r;
    float dy = texture2D(uDepth, uv + vec2(0.0, uTexel.y)).r - texture2D(uDepth, uv - vec2(0.0, uTexel.y)).r;
    vSteep = length(vec2(dx, dy)) * 18.0;
    vec3 p = position + vec3(0.0, 0.0, d * uLift);
    vec4 w = modelMatrix * vec4(p, 1.0);
    vPosW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const fragment = /* glsl */ `
  uniform sampler2D uPhoto; uniform vec3 uTint; uniform float uExposure; uniform float uWarm;
  uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFlash;
  varying vec2 vUv; varying float vH; varying float vSteep; varying vec3 vPosW;
  void main() {
    vec3 c = texture2D(uPhoto, vUv).rgb;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    // Grade: shadows into midnight blue, light into electric blue/white; keep a little original warmth.
    vec3 graded = mix(vec3(0.02, 0.03, 0.07), uTint, smoothstep(0.02, 0.7, l));
    graded = mix(graded, vec3(1.0), smoothstep(0.55, 1.0, l) * 0.6);
    vec3 col = mix(graded, c, uWarm) * uExposure;
    col += vec3(0.7, 0.8, 1.0) * uFlash * (0.2 + vH * 0.6);
    col = mix(col, uFogColor * 1.4, smoothstep(0.35, 1.2, vSteep) * 0.9);
    float dist = length(vPosW - cameraPosition);
    col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, dist));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export interface Relief {
  mesh: THREE.Mesh;
  uniforms: Record<string, { value: unknown }>;
  width: number;
  depthAt(x: number, z: number): number;
}

export const createRelief = async (photo: string, depth: string, width: number, lift: number, look: { tint: number; exposure: number; warm: number; fog: number }): Promise<Relief> => {
  const [photoTex, depthTex] = await Promise.all([loadTexture(photo), loadTexture(depth, false)]);
  const img = photoTex.image as HTMLImageElement;
  const height = width * (img.height / img.width);
  // Read the depth back on the CPU too, so routes can be laid on the surface.
  const dimg = depthTex.image as HTMLImageElement;
  const c = document.createElement("canvas");
  c.width = dimg.width;
  c.height = dimg.height;
  const g = c.getContext("2d")!;
  g.drawImage(dimg, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data;

  const uniforms = {
    uPhoto: { value: photoTex },
    uDepth: { value: depthTex },
    uLift: { value: lift },
    uTexel: { value: new THREE.Vector2(2 / dimg.width, 2 / dimg.height) },
    uTint: { value: new THREE.Color(look.tint) },
    uExposure: { value: look.exposure },
    uWarm: { value: look.warm },
    uFogColor: { value: new THREE.Color(look.fog) },
    uFogNear: { value: 40 },
    uFogFar: { value: 120 },
    uFlash: { value: 0 },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height, 420, Math.round(420 * (height / width))),
    new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return {
    mesh,
    uniforms,
    width,
    depthAt(x, z) {
      const u = x / width + 0.5;
      const v = z / height + 0.5;
      const px = Math.min(c.width - 1, Math.max(0, Math.round(u * (c.width - 1))));
      const py = Math.min(c.height - 1, Math.max(0, Math.round(v * (c.height - 1))));
      return (data[(py * c.width + px) * 4]! / 255) * lift;
    },
  };
};
