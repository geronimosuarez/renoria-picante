import * as THREE from 'three';
import type { BuildingType, CityBuilding } from '../../core/types';

// Ciudad low-poly "golden-hour" en three.js (portada de renoria-shared.jsx).
// Crece al montar (los edificios suben desde el suelo) y deja ruinas en
// proporción a `ruinLevel`. Sólo se renderizan las construcciones que el
// usuario posee (`buildings`), cada una según su tipo. Devuelve un handle
// con dispose().

export interface CityOptions {
  buildings?: CityBuilding[]; // construcciones que posee el usuario (en orden)
  ruinLevel?: number; // 0..1 — proporción de edificios en ruina
  seed?: number;
}

export interface CityHandle {
  dispose(): void;
}

// PRNG determinista para que la misma seed produzca la misma ciudad.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Build {
  g: THREE.Group;
  full: number;
  lit: THREE.Mesh[];
}

export function createCity(container: HTMLElement, opts: CityOptions = {}): CityHandle {
  const W = container.clientWidth || 380;
  const H = container.clientHeight || 300;
  const ruinLevel = opts.ruinLevel ?? 0.18;
  const owned = opts.buildings ?? [{ type: 'house' as const }];

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2a2f4a, 16, 34);

  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // iluminación — cielo crepuscular + key dorado de atardecer
  scene.add(new THREE.HemisphereLight(0x6f86c9, 0x2a2118, 0.85));
  const sun = new THREE.DirectionalLight(0xffd49a, 2.0);
  sun.position.set(-7, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 0.5);
  rim.position.set(6, 4, -6);
  scene.add(rim);
  const glow = new THREE.PointLight(0xffc46b, 1.4, 22, 2);
  glow.position.set(0, 3, 0);
  scene.add(glow);

  const city = new THREE.Group();
  scene.add(city);

  // isla base (disco redondeado)
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(8.4, 8.0, 1.1, 56),
    new THREE.MeshStandardMaterial({ color: 0x4a6b3f, roughness: 0.95 }),
  );
  island.position.y = -0.55;
  island.receiveShadow = true;
  city.add(island);
  const islandRim = new THREE.Mesh(
    new THREE.CylinderGeometry(8.0, 8.4, 0.5, 56),
    new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 }),
  );
  islandRim.position.y = -1.2;
  city.add(islandRim);
  // plaza
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 0.12, 40),
    new THREE.MeshStandardMaterial({ color: 0xb69a6e, roughness: 0.9 }),
  );
  plaza.position.y = 0.06;
  plaza.receiveShadow = true;
  city.add(plaza);

  const rnd = mulberry32(opts.seed ?? 7);
  const goodColors = [0xe0b878, 0xd49a5e, 0xc77f4a, 0xead0a0, 0xcf9f6e, 0xbf8a52];
  const roofColors = [0x9a4f3a, 0x8c4233, 0xb06a3e, 0x7e5230];
  const builds: Build[] = [];

  // Dimensiones base por tipo de construcción.
  const dims: Record<BuildingType, { w: number; d: number; hMin: number; hMax: number }> = {
    house: { w: 0.8, d: 0.8, hMin: 0.8, hMax: 1.1 },
    building: { w: 0.95, d: 0.95, hMin: 1.8, hMax: 2.4 },
    skybuilding: { w: 0.85, d: 0.85, hMin: 3.2, hMax: 4.0 },
  };

  // Lotes disponibles sobre anillos concéntricos: el primero queda cerca de la
  // plaza y los siguientes se van llenando hacia afuera a medida que se compran.
  const rings = [
    { r: 3.4, n: 8 },
    { r: 5.6, n: 12 },
    { r: 7.2, n: 14 },
  ];
  const lots: { x: number; z: number }[] = [];
  rings.forEach((ring) => {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + rnd() * 0.25;
      const r = ring.r + (rnd() - 0.5) * 0.7;
      lots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
  });

  // Sólo renderizamos las construcciones que el usuario posee.
  const count = Math.min(owned.length, lots.length);
  for (let idx = 0; idx < count; idx++) {
    const type = owned[idx].type;
    const lot = lots[idx];
    const isRuin = idx / count > 1 - ruinLevel && rnd() > 0.35;
    const dim = dims[type];
    const w = dim.w + (rnd() - 0.5) * 0.1;
    const d = dim.d + (rnd() - 0.5) * 0.1;
    const h = dim.hMin + rnd() * (dim.hMax - dim.hMin);

    const g = new THREE.Group();
    g.position.set(lot.x, 0, lot.z);
    g.lookAt(0, 0, 0);
    g.rotateY(Math.PI / 2);

    if (isRuin) {
      // rota, inclinada, oscura — sin luces
      const bodyH = h * (0.4 + rnd() * 0.3);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, bodyH, d),
        new THREE.MeshStandardMaterial({ color: 0x595048, roughness: 1 }),
      );
      body.position.y = bodyH / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      body.rotation.z = (rnd() - 0.5) * 0.18;
      g.add(body);
      // escombros
      for (let k = 0; k < 3; k++) {
        const rb = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x4a423b, roughness: 1 }),
        );
        rb.position.set((rnd() - 0.5) * w, 0.1, (rnd() - 0.5) * d);
        rb.rotation.set(rnd(), rnd(), rnd());
        g.add(rb);
      }
      builds.push({ g, full: 1, lit: [] });
    } else {
      const col = goodColors[(rnd() * goodColors.length) | 0];
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 }),
      );
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      if (type === 'house') {
        // casita: techo a dos aguas (cono de 4 lados)
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(w * 0.82, 0.5 + rnd() * 0.3, 4),
          new THREE.MeshStandardMaterial({
            color: roofColors[(rnd() * roofColors.length) | 0],
            roughness: 0.9,
          }),
        );
        roof.position.y = h + 0.22;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        g.add(roof);
      } else {
        // edificio / rascacielos: azotea plana
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(w * 1.02, 0.12, d * 1.02),
          new THREE.MeshStandardMaterial({ color: 0x6b5f52, roughness: 0.9 }),
        );
        cap.position.y = h + 0.06;
        cap.castShadow = true;
        g.add(cap);
        if (type === 'skybuilding') {
          // antena del rascacielos
          const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6),
            new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.6 }),
          );
          mast.position.y = h + 0.45;
          g.add(mast);
        }
      }

      // ventanas que brillan — más filas cuanto más alto es el edificio
      const lit: THREE.Mesh[] = [];
      const rows = Math.max(1, Math.floor(h / 0.62));
      for (let ry = 0; ry < rows; ry++) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.62, 0.16),
          new THREE.MeshStandardMaterial({
            color: 0xffd98a,
            emissive: 0xffb347,
            emissiveIntensity: 1.3,
          }),
        );
        win.position.set(0, 0.4 + ry * 0.62, d / 2 + 0.001);
        g.add(win);
        lit.push(win);
      }
      builds.push({ g, full: 1, lit });
    }
    g.scale.y = 0.001;
    city.add(g);
  }

  // árboles
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 2.6 + rnd() * 5.2;
    const tg = new THREE.Group();
    tg.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 }),
    );
    trunk.position.y = 0.2;
    tg.add(trunk);
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.7, 7),
      new THREE.MeshStandardMaterial({ color: 0x3f7a44, roughness: 0.9 }),
    );
    leaf.position.y = 0.62;
    leaf.castShadow = true;
    tg.add(leaf);
    tg.scale.setScalar(0.001);
    city.add(tg);
    builds.push({ g: tg, full: 0.85 + rnd() * 0.3, lit: [] });
  }

  // luciérnagas
  const fcount = 26;
  const fgeo = new THREE.BufferGeometry();
  const fpos = new Float32Array(fcount * 3);
  for (let i = 0; i < fcount; i++) {
    const a = rnd() * Math.PI * 2;
    const r = rnd() * 7;
    fpos[i * 3] = Math.cos(a) * r;
    fpos[i * 3 + 1] = 0.6 + rnd() * 3.4;
    fpos[i * 3 + 2] = Math.sin(a) * r;
  }
  fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const flies = new THREE.Points(
    fgeo,
    new THREE.PointsMaterial({ color: 0xffd98a, size: 0.13, transparent: true, opacity: 0.9 }),
  );
  city.add(flies);

  let raf = 0;
  const t0 = performance.now();
  let running = true;
  function frame() {
    if (!running) return;
    const t = (performance.now() - t0) / 1000;
    // crecer los edificios
    builds.forEach((b, i) => {
      const start = 0.25 + i * 0.035;
      const p = Math.min(1, Math.max(0, (t - start) / 0.7));
      const eased = 1 - Math.pow(1 - p, 3);
      b.g.scale.y = Math.max(0.001, eased * b.full);
      b.lit.forEach((w) => {
        (w.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.6 + Math.sin(t * 2 + i) * 0.25 + 0.7;
      });
    });
    city.rotation.y = -0.5 + Math.sin(t * 0.12) * 0.35;
    flies.position.y = Math.sin(t * 0.6) * 0.2;
    (flies.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(t * 2) * 0.4;
    const camR = 15.5;
    camera.position.set(Math.sin(0.4) * camR, 8.5, Math.cos(0.4) * camR);
    camera.lookAt(0, 1.2, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  frame();

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
