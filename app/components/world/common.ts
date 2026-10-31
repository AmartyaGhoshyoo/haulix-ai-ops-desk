// Shared pieces for the 3D world: loaders, colours, and the "place" contract every scene follows.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export const BLUE = 0x2f6bff, SOFT = 0x6e95ff, RED = 0xff3b5c, NIGHT = 0x0a0d1a;

/** A place is one self-contained scene the camera can visit. */
export interface Place {
  scene: THREE.Scene;
  /** Called every frame while the place is on screen. `t` seconds, `dt` seconds. */
  update(t: number, dt: number, camera: THREE.PerspectiveCamera): void;
  dispose(): void;
}

export const textureLoader = new THREE.TextureLoader();
export const gltfLoader = new GLTFLoader();

export const loadTexture = (url: string, srgb = true) =>
  textureLoader.loadAsync(url).then((t) => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });

export const loadModel = (url: string) => gltfLoader.loadAsync(url).then((g) => g.scene);

export const loadHDR = (url: string, renderer: THREE.WebGLRenderer) =>
  new RGBELoader().loadAsync(url).then((tex) => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
    return env;
  });

/** Scale a loaded model so one of its dimensions matches `size`, and stand it on y = 0. */
export const fit = (obj: THREE.Object3D, size: number, axis: "x" | "y" | "z" = "y") => {
  const box = new THREE.Box3().setFromObject(obj);
  const dims = box.getSize(new THREE.Vector3());
  obj.scale.multiplyScalar(size / Math.max(1e-4, dims[axis]));
  const after = new THREE.Box3().setFromObject(obj);
  const centre = after.getCenter(new THREE.Vector3());
  obj.position.x -= centre.x;
  obj.position.z -= centre.z;
  obj.position.y -= after.min.y;
  const wrap = new THREE.Group();
  wrap.add(obj);
  return wrap;
};

export const disposeScene = (scene: THREE.Scene) => {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
  });
};

/** A glowing tube along a curve, drawable progressively with setDrawRange. */
export const tube = (curve: THREE.Curve<THREE.Vector3>, radius: number, color: number, opacity = 1) => {
  const geometry = new THREE.TubeGeometry(curve, 160, radius, 8, false);
  const material = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false });
  return new THREE.Mesh(geometry, material);
};
