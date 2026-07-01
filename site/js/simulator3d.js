// Interactive 3D simulator: cargo-packing assembly + carbon-aware route drive.
// Consumes an optimization result and animates both stages with telemetry.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PALETTE = [0x34d399, 0x60a5fa, 0xf472b6, 0xfbbf24, 0xa78bfa, 0xfb7185, 0x22d3ee, 0xfacc15];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const tele = {
  status: document.getElementById("tele-status"),
  weight: document.getElementById("tele-weight"),
  segment: document.getElementById("tele-segment"),
  slope: document.getElementById("tele-slope"),
};

export function createSimulator() {
  const canvas = document.getElementById("sim-canvas");
  if (!canvas) return null;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030a1a);
  scene.fog = new THREE.FogExp2(0x030a1a, 0.02);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(9, 8, 12);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 1.5, 0);

  // Lights.
  scene.add(new THREE.AmbientLight(0x334155, 1.4));
  const key = new THREE.DirectionalLight(0x6ee7b7, 2);
  key.position.set(8, 16, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const pt = new THREE.PointLight(0x22d3ee, 40, 60);
  pt.position.set(-10, 8, -8);
  scene.add(pt);

  const packGroup = new THREE.Group();
  const routeGroup = new THREE.Group();
  scene.add(packGroup, routeGroup);

  let data = null;
  let mode = "packing";
  let playing = !reduceMotion;
  let speed = 1;
  let elapsed = 0;
  let packBoxes = [];   // { mesh, targetY, appearAt }
  let routeTruck = null;
  let routePoints = []; // Vector3 in route order
  let segMeta = [];     // { slope, weight, fromName, toName }
  let cargoBoxes = [];  // mini boxes riding in the trailer (unloaded at stops)
  const clock = new THREE.Clock();

  /* ── Builders ─────────────────────────────────────── */
  function clearGroup(g) {
    while (g.children.length) {
      const c = g.children.pop();
      c.geometry?.dispose?.();
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material?.dispose?.();
    }
  }

  function buildPacking() {
    clearGroup(packGroup);
    packBoxes = [];
    if (!data) return;

    const c = data.container;
    const scale = 6 / Math.max(c.W, c.H, c.D);
    const ox = -(c.W * scale) / 2;
    const oz = -(c.D * scale) / 2;

    // Container wireframe.
    const box = new THREE.BoxGeometry(c.W * scale, c.H * scale, c.D * scale);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: 0x475569 })
    );
    edges.position.set(0, (c.H * scale) / 2, 0);
    packGroup.add(edges);

    // Floor plate.
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(c.W * scale, 0.05, c.D * scale),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.7 })
    );
    plate.receiveShadow = true;
    packGroup.add(plate);

    const placements = [...data.packing.placements].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
    placements.forEach((p, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: PALETTE[i % PALETTE.length],
        metalness: 0.35, roughness: 0.4,
        emissive: PALETTE[i % PALETTE.length], emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(p.w * scale * 0.96, p.h * scale * 0.96, p.d * scale * 0.96),
        mat
      );
      mesh.castShadow = true;
      const finalY = (p.y + p.h / 2) * scale;
      mesh.position.set(ox + (p.x + p.w / 2) * scale, finalY, oz + (p.z + p.d / 2) * scale);
      mesh.visible = false;
      packGroup.add(mesh);
      packBoxes.push({ mesh, finalY, appearAt: i * 0.35 });
    });
  }

  function buildRouting() {
    clearGroup(routeGroup);
    routePoints = [];
    segMeta = [];
    routeTruck = null;
    cargoBoxes = [];
    if (!data) return;

    const stops = data.stops;
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const maxEl = Math.max(...stops.map((s) => s.elevation));
    const SPAN = 16;

    const project = (s) => new THREE.Vector3(
      ((s.lng - minLng) / (maxLng - minLng || 1) - 0.5) * SPAN,
      (s.elevation / maxEl) * 4 + 0.3,
      ((s.lat - minLat) / (maxLat - minLat || 1) - 0.5) * SPAN
    );

    const stopById = new Map(stops.map((s) => [s.id, s]));

    // Terrain plane with subtle relief.
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(SPAN * 1.6, SPAN * 1.6, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0x0b2e26, metalness: 0.1, roughness: 0.95, wireframe: false })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    const pos = terrain.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.4) * Math.cos(y * 0.4) * 0.4);
    }
    pos.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    routeGroup.add(terrain);

    const gridUnder = new THREE.GridHelper(SPAN * 1.6, 32, 0x10b981, 0x123);
    gridUnder.material.transparent = true;
    gridUnder.material.opacity = 0.15;
    routeGroup.add(gridUnder);

    // Route points in delivery order.
    const order = data.optimized.order;
    order.forEach((id) => routePoints.push(project(stopById.get(id))));

    // Segment metadata for telemetry.
    data.optimized.segments.forEach((seg) => {
      segMeta.push({
        slope: seg.slopePct,
        weight: seg.cargoWeightKg,
        fromName: stopById.get(seg.fromId)?.name ?? seg.fromId,
        toName: stopById.get(seg.toId)?.name ?? seg.toId,
      });
    });

    // Route tube.
    const curve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.3);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 200, 0.08, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 })
    );
    routeGroup.add(tube);
    routeGroup.userData.curve = curve;

    // Stop markers + labels.
    order.forEach((id, i) => {
      const s = stopById.get(id);
      const p = project(s);
      const isDepot = i === 0;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(isDepot ? 0.4 : 0.28, 16, 16),
        new THREE.MeshStandardMaterial({
          color: isDepot ? 0xfbbf24 : 0x34d399,
          emissive: isDepot ? 0xf59e0b : 0x10b981, emissiveIntensity: 0.5,
        })
      );
      marker.position.copy(p);
      marker.castShadow = true;
      routeGroup.add(marker);

      // Elevation stem.
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, p.y, 6),
        new THREE.MeshBasicMaterial({ color: 0x1e40af, transparent: true, opacity: 0.4 })
      );
      stem.position.set(p.x, p.y / 2, p.z);
      routeGroup.add(stem);

      routeGroup.add(makeLabel(`${i + 1}. ${s.name}`, p.clone().add(new THREE.Vector3(0, 0.7, 0))));
    });

    // Truck with visible cargo that gets unloaded stop-by-stop.
    const orderIndexById = new Map(order.map((id, i) => [id, i]));
    const built = buildTruck(data.packing.placements, orderIndexById);
    routeTruck = built.group;
    cargoBoxes = built.boxes;
    routeTruck.position.copy(routePoints[0]);
    routeGroup.add(routeTruck);
  }

  function buildTruck(placements, orderIndexById) {
    const g = new THREE.Group();
    g.scale.setScalar(0.9);

    const cabMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x064e3b, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.3 });
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.6 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    // Cabin (front, +x) + windshield.
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.62), cabMat);
    cab.position.set(0.95, 0.55, 0); cab.castShadow = true; g.add(cab);
    const wind = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0369a1, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.1 })
    );
    wind.position.set(1.3, 0.62, 0); g.add(wind);

    // Open-top trailer bed (so cargo is visible) with side + back rails.
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.78), trailerMat);
    bed.position.set(-0.15, 0.28, 0); bed.castShadow = true; g.add(bed);
    const railGeo = new THREE.BoxGeometry(1.7, 0.3, 0.06);
    const railL = new THREE.Mesh(railGeo, trailerMat); railL.position.set(-0.15, 0.43, 0.38); g.add(railL);
    const railR = new THREE.Mesh(railGeo, trailerMat); railR.position.set(-0.15, 0.43, -0.38); g.add(railR);
    const railBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.78), trailerMat); railBack.position.set(-1.0, 0.43, 0); g.add(railBack);

    // Wheels.
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 14);
    wheelGeo.rotateX(Math.PI / 2);
    [[0.9, 0.38], [0.9, -0.38], [-0.3, 0.38], [-0.3, -0.38], [-0.9, 0.38], [-0.9, -0.38]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, 0.18, wz); wheel.castShadow = true; g.add(wheel);
    });

    const glow = new THREE.PointLight(0x34d399, 6, 4); glow.position.set(0, 0.9, 0); g.add(glow);

    // Cargo boxes stacked in the bed, each tagged with its destination order index.
    const boxes = [];
    const BS = 0.24;
    const cols = 5, rows = 3;
    placements.forEach((p, idx) => {
      const destOrderIndex = orderIndexById.get(p.item.destinationId) ?? 0;
      const mat = new THREE.MeshStandardMaterial({
        color: PALETTE[idx % PALETTE.length], metalness: 0.35, roughness: 0.4,
        emissive: PALETTE[idx % PALETTE.length], emissiveIntensity: 0.12,
        transparent: true, opacity: 1,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(BS, BS, BS), mat);
      box.castShadow = true;
      const layer = Math.floor(idx / (cols * rows));
      const within = idx % (cols * rows);
      const xi = within % cols;
      const zi = Math.floor(within / cols);
      const home = new THREE.Vector3(
        0.55 - xi * (BS + 0.03),
        0.48 + layer * (BS + 0.02),
        -0.26 + zi * (BS + 0.02)
      );
      box.position.copy(home);
      box.userData = { home, destOrderIndex };
      g.add(box);
      boxes.push(box);
    });

    return { group: g, boxes };
  }

  function makeLabel(text, position) {
    const canvas2 = document.createElement("canvas");
    const ctx = canvas2.getContext("2d");
    canvas2.width = 256; canvas2.height = 64;
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillStyle = "rgba(2,6,23,0.75)";
    const w = ctx.measureText(text).width + 20;
    ctx.fillRect((256 - w) / 2, 12, w, 40);
    ctx.fillStyle = "#cbd5e1";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(canvas2);
    tex.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2.6, 0.65, 1);
    sprite.position.copy(position);
    return sprite;
  }

  /* ── Telemetry ────────────────────────────────────── */
  function setTele(status, weight, segment, slope) {
    if (tele.status) tele.status.textContent = status;
    if (tele.weight) tele.weight.textContent = `${Math.round(weight)} kg`;
    if (tele.segment) tele.segment.textContent = segment;
    if (tele.slope) tele.slope.textContent = `${slope >= 0 ? "+" : ""}${slope.toFixed(1)}%`;
  }

  /* ── Animation ────────────────────────────────────── */
  const PACK_STEP = 0.35;      // seconds between boxes
  const DRIVE_TIME = 1.7;      // seconds driving each route segment
  const UNLOAD_TIME = 1.1;     // seconds parked, unloading at each arrival stop
  const BLOCK_TIME = DRIVE_TIME + UNLOAD_TIME;
  const END_PAUSE = 1.2;       // pause at the depot before looping

  function updatePacking(dt) {
    elapsed += dt;
    let placed = 0;
    packBoxes.forEach((b) => {
      if (elapsed >= b.appearAt) {
        b.mesh.visible = true;
        const p = Math.min((elapsed - b.appearAt) / 0.4, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        b.mesh.position.y = b.finalY + (1 - eased) * 4;
        b.mesh.scale.setScalar(0.4 + eased * 0.6);
        if (p >= 1) placed++;
      }
    });
    const total = packBoxes.length;
    const eff = data ? data.packing.volumeEfficiency : 0;
    if (placed >= total && total > 0) {
      setTele(`Packed · ${eff.toFixed(1)}% full`, data.packing.totalWeight, `${total} items`, 0);
      if (elapsed > total * PACK_STEP + 2) elapsed = 0; // loop
    } else {
      setTele("Loading cargo…", (placed / Math.max(total, 1)) * (data?.packing.totalWeight || 0), `${placed}/${total} items`, 0);
    }
  }

  function updateRouting(dt) {
    if (!routeTruck || routePoints.length < 2) return;
    elapsed += dt;
    const nSeg = routePoints.length - 1;
    const cycle = nSeg * BLOCK_TIME + END_PAUSE;
    const loopT = elapsed % cycle;

    // Resolve the current block (segment), phase (drive/unload), and progress.
    let seg, phase, segT = 0, unloadU = 0, atEnd = false;
    if (loopT >= nSeg * BLOCK_TIME) {
      atEnd = true;
      seg = nSeg - 1;
      phase = "end";
    } else {
      seg = Math.floor(loopT / BLOCK_TIME);
      const inBlock = loopT - seg * BLOCK_TIME;
      if (inBlock < DRIVE_TIME) { phase = "drive"; segT = inBlock / DRIVE_TIME; }
      else { phase = "unload"; unloadU = (inBlock - DRIVE_TIME) / UNLOAD_TIME; }
    }

    const a = routePoints[seg];
    const b = routePoints[seg + 1];

    // Truck position: driving lerps A→B; unloading / end parks at the stop.
    const pos = phase === "drive" ? a.clone().lerp(b, easeInOut(segT)) : b.clone();
    routeTruck.position.copy(pos);
    const dir = b.clone().sub(a);
    if (dir.lengthSq() > 1e-6) routeTruck.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI / 2;

    // Unload the cargo: each box is dropped when the truck reaches its stop.
    // deliverBlock = (destination's order index) - 1  → the segment that ends there.
    cargoBoxes.forEach((box) => {
      const deliverBlock = box.userData.destOrderIndex - 1;
      const home = box.userData.home;

      const goneAlready = deliverBlock < seg;
      const finishedNow = deliverBlock === seg && phase === "unload" && unloadU >= 1;

      if (atEnd || goneAlready || finishedNow) {
        box.visible = false;
        return;
      }

      if (deliverBlock === seg && phase === "unload") {
        // Drop-off animation: slide out the back, sink, shrink and fade.
        const u = easeInOut(unloadU);
        box.visible = true;
        box.position.set(home.x - u * 0.5, home.y - u * 1.1, home.z);
        box.scale.setScalar(1 - 0.55 * u);
        box.material.opacity = 1 - u;
      } else {
        // Still on board.
        box.visible = true;
        box.position.copy(home);
        box.scale.setScalar(1);
        box.material.opacity = 1;
      }
    });

    const meta = segMeta[seg] || { slope: 0, weight: 0, fromName: "", toName: "" };
    const status = atEnd
      ? "Returned to depot · empty"
      : phase === "unload"
        ? `Unloading at ${meta.toName}`
        : "En route";
    setTele(status, atEnd ? 0 : meta.weight, `${meta.fromName} → ${meta.toName}`, meta.slope);
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ── Loop ─────────────────────────────────────────── */
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05) * speed;
    if (playing) {
      if (mode === "packing") updatePacking(dt);
      else updateRouting(dt);
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  /* ── Public API ───────────────────────────────────── */
  function applyMode() {
    packGroup.visible = mode === "packing";
    routeGroup.visible = mode === "routing";
    elapsed = 0;
    if (mode === "packing") {
      controls.target.set(0, 2, 0);
      camera.position.set(8, 7, 10);
    } else {
      controls.target.set(0, 2, 0);
      camera.position.set(0, 12, 16);
    }
  }

  const api = {
    setData(next) {
      data = next;
      buildPacking();
      buildRouting();
      applyMode();
      resize();

      // Resting state so the scene reads correctly even before/without playback
      // (e.g. prefers-reduced-motion, where the animation loop stays paused).
      if (reduceMotion || !playing) {
        packBoxes.forEach((b) => {
          b.mesh.visible = true;
          b.mesh.position.y = b.finalY;
          b.mesh.scale.setScalar(1);
        });
        if (mode === "packing") {
          setTele(`Packed · ${data.packing.volumeEfficiency.toFixed(1)}% full`, data.packing.totalWeight, `${packBoxes.length} items`, 0);
        } else {
          // Park the fully-loaded truck at the depot with all cargo aboard.
          if (routeTruck && routePoints.length) routeTruck.position.copy(routePoints[0]);
          cargoBoxes.forEach((box) => {
            box.visible = true;
            box.position.copy(box.userData.home);
            box.scale.setScalar(1);
            box.material.opacity = 1;
          });
          const first = segMeta[0] || { slope: 0, weight: data.packing.totalWeight, fromName: "Depot", toName: "" };
          setTele("Ready · fully loaded", first.weight, `${first.fromName} → ${first.toName}`, first.slope);
        }
      }
    },
    setMode(next) { mode = next; applyMode(); },
    play() { playing = true; },
    pause() { playing = false; },
    toggle() { playing = !playing; return playing; },
    restart() { elapsed = 0; },
    setSpeed(s) { speed = s; },
    resize,
  };

  // Kick the render loop (renders even while paused so it's interactive).
  requestAnimationFrame(loop);
  // Delay a resize until layout settles.
  setTimeout(resize, 50);

  return api;
}
