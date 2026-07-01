// Heavy animated 3D hero scene: procedural delivery truck, orbiting cargo,
// particle field, glowing terrain grid, emerald lighting and camera drift.

import * as THREE from "three";

const PALETTE = [0x34d399, 0x60a5fa, 0xf472b6, 0xfbbf24, 0xa78bfa, 0x22d3ee];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Build a stylized low-poly delivery truck as a THREE.Group. */
function buildTruck() {
  const truck = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.5, roughness: 0.4 });
  const cargoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.3, roughness: 0.55 });
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3, emissive: 0x064e3b, emissiveIntensity: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.9, roughness: 0.1, emissive: 0x0369a1, emissiveIntensity: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.6 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x34d399, metalness: 0.8, roughness: 0.2, emissive: 0x10b981, emissiveIntensity: 0.3 });

  // Cargo box.
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 2), cargoMat);
  cargo.position.set(-0.6, 1.5, 0);
  cargo.castShadow = true;
  truck.add(cargo);

  // Cargo edge trim (emerald frame).
  const trim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.42, 2.22, 2.02)),
    new THREE.LineBasicMaterial({ color: 0x34d399 })
  );
  trim.position.copy(cargo.position);
  truck.add(trim);

  // Cab.
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 2), cabMat);
  cab.position.set(2, 1.25, 0);
  cab.castShadow = true;
  truck.add(cab);

  // Windshield.
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 1.7), glassMat);
  glass.position.set(2.8, 1.55, 0);
  truck.add(glass);

  // Chassis.
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 1.9), chassisMat);
  chassis.position.set(0.2, 0.5, 0);
  truck.add(chassis);

  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 22);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.42, 12);
  const wheelPos = [[-1.4, -1], [-1.4, 1], [2, -1], [2, 1]];
  const wheels = [];
  for (const [x, z] of wheelPos) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.4, z);
    w.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.4, z);
    truck.add(w, rim);
    wheels.push(w, rim);
  }

  truck.userData.wheels = wheels;
  return truck;
}

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.FogExp2(0x020617, 0.028);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
  camera.position.set(9, 6, 12);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting.
  scene.add(new THREE.AmbientLight(0x1e293b, 1.2));
  const key = new THREE.DirectionalLight(0x6ee7b7, 2.2);
  key.position.set(8, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 60, 40);
  rim.position.set(-10, 6, -6);
  scene.add(rim);
  const fill = new THREE.PointLight(0x10b981, 40, 40);
  fill.position.set(6, 3, -8);
  scene.add(fill);

  // Glowing ground grid.
  const grid = new THREE.GridHelper(120, 60, 0x10b981, 0x0f3d33);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.position.y = 0;
  scene.add(grid);

  // Shadow-catcher floor.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Truck.
  const truck = buildTruck();
  truck.position.y = 0;
  scene.add(truck);

  // Orbiting cargo crates.
  const crates = new THREE.Group();
  scene.add(crates);
  for (let i = 0; i < 9; i++) {
    const size = 0.6 + Math.random() * 0.7;
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({
        color: PALETTE[i % PALETTE.length],
        metalness: 0.4, roughness: 0.35,
        emissive: PALETTE[i % PALETTE.length], emissiveIntensity: 0.15,
      })
    );
    crate.castShadow = true;
    crate.userData = {
      radius: 6 + Math.random() * 5,
      speed: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      y: 2 + Math.random() * 5,
      spin: (Math.random() - 0.5) * 0.02,
    };
    crates.add(crate);
  }

  // Particle field.
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 1] = Math.random() * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0x34d399, size: 0.14, transparent: true, opacity: 0.6, sizeAttenuation: true })
  );
  scene.add(particles);

  // Mouse parallax.
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();

  function frame() {
    const t = clock.getElapsedTime();

    truck.rotation.y = Math.sin(t * 0.25) * 0.35 + t * 0.08;
    truck.position.y = Math.sin(t * 1.1) * 0.12;
    (truck.userData.wheels || []).forEach((w) => (w.rotation.y += 0.04));

    crates.children.forEach((c) => {
      const d = c.userData;
      c.position.set(
        Math.cos(t * d.speed + d.phase) * d.radius,
        d.y + Math.sin(t * d.speed * 1.5 + d.phase) * 0.5,
        Math.sin(t * d.speed + d.phase) * d.radius
      );
      c.rotation.x += d.spin;
      c.rotation.y += d.spin * 1.3;
    });

    particles.rotation.y = t * 0.02;

    // Camera drift + parallax.
    const targetX = 9 + mouse.x * 1.5;
    const targetY = 6 - mouse.y * 1.2;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z = 12 + Math.sin(t * 0.15) * 1.5;
    camera.lookAt(0, 1.6, 0);

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    renderer.render(scene, camera); // single static frame
  } else {
    requestAnimationFrame(frame);
  }
}
