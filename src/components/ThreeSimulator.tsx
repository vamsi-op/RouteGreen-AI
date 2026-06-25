"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { PackingResult, Container, RouteResult, Stop } from "@/lib/types";

const PALETTE = [
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // pink
  "#fbbf24", // amber
  "#a78bfa", // purple
  "#fb7185", // rose
  "#22d3ee", // cyan
  "#facc15", // yellow
];

export function ThreeSimulator({
  packing,
  route,
  stops,
  container,
}: {
  packing: PackingResult;
  route: RouteResult;
  stops: Stop[];
  container: Container;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"packing" | "routing">("packing");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [telemetry, setTelemetry] = useState({
    status: "Initializing...",
    weight: 0,
    segment: "",
    slope: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger hydration mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Three.js Scene Setup ────────────────────────────
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090f1d");

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 15);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground

    // Lights
    const ambientLight = new THREE.AmbientLight("#38bdf8", 0.15); // soft cyan ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#ffffff", 1.2);
    dirLight.position.set(15, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight("#10b981", 0.4); // green fill light
    dirLight2.position.set(-15, 5, -10);
    scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(30, 30, "#1e293b", "#0f172a");
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // ── Mode Scene Building ─────────────────────────────
    const cleanupGroup = new THREE.Group();
    scene.add(cleanupGroup);

    // Trackers for animation
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let animTime = 0;

    // Create materials palette
    const materials = PALETTE.map((hex) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: 0.2,
        metalness: 0.1,
      });
    });

    if (mode === "packing") {
      // ─── PACKING MODE VISUALIZATION ─────────────────
      camera.position.set(6, 6, 8);
      controls.target.set(0, 0, 0);

      // Create Container wireframe
      // Container dimensions scaled down
      const scaleFactor = 3 / Math.max(container.W, container.H, container.D);
      const cW = container.W * scaleFactor;
      const cH = container.H * scaleFactor;
      const cD = container.D * scaleFactor;

      // Container Box outline
      const boxGeo = new THREE.BoxGeometry(cW, cH, cD);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: "#334155", linewidth: 2 });
      const containerWire = new THREE.LineSegments(edges, lineMat);
      // Shift container so origin is bottom-front-left corner
      containerWire.position.set(0, cH / 2, 0);
      cleanupGroup.add(containerWire);

      // Solid transparent base
      const baseGeo = new THREE.BoxGeometry(cW, 0.05, cD);
      const baseMat = new THREE.MeshStandardMaterial({
        color: "#1e293b",
        transparent: true,
        opacity: 0.6,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(0, 0, 0);
      cleanupGroup.add(baseMesh);

      // Build cargo meshes
      const itemsList: Array<{
        mesh: THREE.Mesh;
        targetPos: THREE.Vector3;
        startPos: THREE.Vector3;
        duration: number;
        delay: number;
      }> = [];

      packing.placements.forEach((p, idx) => {
        const itemW = p.w * scaleFactor;
        const itemH = p.h * scaleFactor;
        const itemD = p.d * scaleFactor;

        const geo = new THREE.BoxGeometry(itemW, itemH, itemD);
        const mat = materials[idx % materials.length];
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Origin of placed item in solver is back-bottom-left.
        // Convert to centered Three.js coordinates inside container
        const tx = (p.x + p.w / 2) * scaleFactor - cW / 2;
        const ty = (p.y + p.h / 2) * scaleFactor; // relative to container bottom y=0
        const tz = (p.z + p.d / 2) * scaleFactor - cD / 2;

        const targetPos = new THREE.Vector3(tx, ty, tz);
        // Start position: flying from top-sky
        const startPos = new THREE.Vector3(tx, ty + 6, tz);

        mesh.position.copy(startPos);
        mesh.scale.set(0.01, 0.01, 0.01); // start tiny

        cleanupGroup.add(mesh);

        itemsList.push({
          mesh,
          targetPos,
          startPos,
          duration: 0.6, // seconds
          delay: idx * 0.4, // sequential delay
        });
      });

      // Animation Loop
      const animatePacking = () => {
        const delta = clock.getDelta();
        if (isPlaying) {
          animTime += delta * speed;
        }

        let loadedWeight = 0;
        let placedCount = 0;

        itemsList.forEach((item, idx) => {
          const t = animTime - item.delay;
          if (t <= 0) {
            item.mesh.position.copy(item.startPos);
            item.mesh.scale.set(0, 0, 0);
          } else if (t < item.duration) {
            const ratio = t / item.duration;
            // Easing out-cubic
            const ease = 1 - Math.pow(1 - ratio, 3);
            item.mesh.position.lerpVectors(item.startPos, item.targetPos, ease);
            item.mesh.scale.setScalar(ease);
            
            loadedWeight += packing.placements[idx].item.weight * ratio;
            placedCount++;
          } else {
            item.mesh.position.copy(item.targetPos);
            item.mesh.scale.set(1, 1, 1);
            loadedWeight += packing.placements[idx].item.weight;
            placedCount++;
          }
        });

        // Loop animation when finished
        if (animTime > itemsList.length * 0.4 + 1.5) {
          animTime = 0;
        }

        setTelemetry({
          status: `Packing items... (${placedCount}/${packing.placements.length})`,
          weight: Math.round(loadedWeight),
          segment: "N/A (Container Loading)",
          slope: 0,
        });

        controls.update();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animatePacking);
      };

      animatePacking();

    } else {
      // ─── ROUTING MODE VISUALIZATION ─────────────────
      camera.position.set(15, 12, 18);
      controls.target.set(0, 2, 0);

      // Build 3D Terrain
      const terrainGeo = new THREE.PlaneGeometry(24, 24, 60, 60);
      terrainGeo.rotateX(-Math.PI / 2); // make horizontal

      // Build mapping from actual stop points
      // Map stops to relative coordinates in our 24x24 3D scene grid.
      const stopNodes = route.order.map((stopId) => stops.find((s) => s.id === stopId)!);
      
      // Relative positions in 3D scene
      const node3DPositions = stopNodes.map((s, idx) => {
        // Map longitude/latitude coordinates to scene x/z
        let rx = (s.lng - 91.8) * 35; 
        let rz = -(s.lat - 25.8) * 35; // invert latitude for WebGL z-axis
        let ry = s.elevation / 350;    // scale altitude to 3D y-axis
        return new THREE.Vector3(rx, ry, rz);
      });

      // Displace terrain vertices based on proximity to stops to create realistic hills
      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);

        let vy = 0.1;
        // Interpolate hills
        node3DPositions.forEach((pos) => {
          const dist = Math.sqrt((vx - pos.x) ** 2 + (vz - pos.z) ** 2);
          const hillH = pos.y;
          const radius = 6;
          if (dist < radius) {
            const factor = 1 - dist / radius;
            const smoothFactor = Math.sin(factor * Math.PI / 2) ** 2;
            vy = Math.max(vy, hillH * smoothFactor);
          }
        });
        
        // Add tiny noise for terrain texture
        vy += Math.sin(vx * 1.5) * Math.cos(vz * 1.5) * 0.15;
        posAttr.setY(i, vy);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        color: "#0f2027",
        roughness: 0.85,
        metalness: 0.2,
        flatShading: true,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = true;
      cleanupGroup.add(terrainMesh);

      // Draw Flags/Markers for Stops
      const flagGeos = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
      const flagMat = new THREE.MeshStandardMaterial({ color: "#ef4444", roughness: 0.4 });
      const depotMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", roughness: 0.4 });

      const stopMeshes: THREE.Group[] = [];

      node3DPositions.forEach((pos, idx) => {
        if (idx === node3DPositions.length - 1) return;

        const stopObj = stopNodes[idx];
        const isDepot = idx === 0;

        const group = new THREE.Group();
        group.position.copy(pos);

        // Cylinder Base pin
        const pin = new THREE.Mesh(flagGeos, isDepot ? depotMat : flagMat);
        pin.position.y = 0.6;
        pin.castShadow = true;
        group.add(pin);

        // Sphere glow top
        const sphereGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: isDepot ? "#fbbf24" : "#10b981" });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.y = 1.2;
        group.add(sphere);

        cleanupGroup.add(group);
        stopMeshes.push(group);
      });

      // Draw Route Path Curve (Tube)
      const pathPoints = [...node3DPositions];
      const routeCurve = new THREE.CatmullRomCurve3(pathPoints, true); // closed loop
      const tubeGeo = new THREE.TubeGeometry(routeCurve, 100, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: "#10b981",
        transparent: true,
        opacity: 0.7,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      cleanupGroup.add(tubeMesh);

      // Create a 3D Toy Truck
      const truckGroup = new THREE.Group();
      truckGroup.scale.set(0.7, 0.7, 0.7);
      
      // Cabin
      const cabGeo = new THREE.BoxGeometry(0.8, 0.7, 0.6);
      const cabMat = new THREE.MeshStandardMaterial({ color: "#10b981" });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0.4, 0.35, 0);
      cab.castShadow = true;
      truckGroup.add(cab);

      // Windshield
      const windGeo = new THREE.BoxGeometry(0.2, 0.3, 0.5);
      const windMat = new THREE.MeshStandardMaterial({ color: "#0f172a" });
      const wind = new THREE.Mesh(windGeo, windMat);
      wind.position.set(0.71, 0.45, 0);
      truckGroup.add(wind);

      // Trailer (Cargo bed)
      const trailGeo = new THREE.BoxGeometry(1.6, 0.9, 0.7);
      const trailMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.5 });
      const trailer = new THREE.Mesh(trailGeo, trailMat);
      trailer.position.set(-0.8, 0.45, 0);
      trailer.castShadow = true;
      truckGroup.add(trailer);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12);
      wheelGeo.rotateX(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.9 });
      const wheelPositions = [
        [0.4, 0.1, 0.32],
        [0.4, 0.1, -0.32],
        [-0.4, 0.1, 0.32],
        [-0.4, 0.1, -0.32],
        [-1.2, 0.1, 0.32],
        [-1.2, 0.1, -0.32],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        truckGroup.add(wheel);
      });

      cleanupGroup.add(truckGroup);

      // Cargo load display inside route mode
      const truckCargoGroup = new THREE.Group();
      truckCargoGroup.position.set(-0.8, 1.0, 0);
      truckGroup.add(truckCargoGroup);

      const cargoBoxes: THREE.Mesh[] = [];
      const totalWeight = packing.placements.reduce((sum, p) => sum + p.item.weight, 0);

      // Fill truck cargo bed with miniature blocks
      packing.placements.forEach((p, idx) => {
        const miniGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = materials[idx % materials.length];
        const box = new THREE.Mesh(miniGeo, mat);
        box.castShadow = true;
        
        const row = Math.floor(idx / 6);
        const col = idx % 6;
        box.position.set(-0.6 + col * 0.25, 0.15, -0.2 + row * 0.2);
        
        truckCargoGroup.add(box);
        cargoBoxes.push(box);
      });

      // Animation calculations
      const totalDuration = 22; // total seconds for full loop
      const segmentCount = node3DPositions.length - 1;
      const durationPerSegment = totalDuration / segmentCount;

      const animateRouting = () => {
        const delta = clock.getDelta();
        if (isPlaying) {
          animTime += delta * speed;
        }

        if (animTime > totalDuration) {
          animTime = 0;
        }

        const segmentIdx = Math.floor(animTime / durationPerSegment) % segmentCount;
        const segmentProgress = (animTime % durationPerSegment) / durationPerSegment;

        const startNode = stopNodes[segmentIdx];
        const endNode = stopNodes[segmentIdx + 1];
        const startPos = node3DPositions[segmentIdx];
        const endPos = node3DPositions[segmentIdx + 1];

        const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, segmentProgress);
        truckGroup.position.copy(currentPos);

        const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const angle = Math.atan2(-dir.z, dir.x);
        truckGroup.rotation.y = angle;

        const heightDiff = endPos.y - startPos.y;
        const horizontalDist = Math.sqrt((endPos.x - startPos.x) ** 2 + (endPos.z - startPos.z) ** 2);
        const pitchAngle = Math.atan2(heightDiff, horizontalDist);
        truckGroup.rotation.z = pitchAngle;

        let currentWeight = totalWeight;
        
        for (let s = 1; s <= segmentIdx; s++) {
          const visitedStopId = stopNodes[s].id;
          const deliveredItems = packing.placements.filter(
            (p) => p.item.destinationId === visitedStopId
          );
          
          deliveredItems.forEach((p) => {
            currentWeight -= p.item.weight;
          });
        }

        packing.placements.forEach((p, idx) => {
          const box = cargoBoxes[idx];
          if (!box) return;

          let isDelivered = false;
          for (let s = 1; s <= segmentIdx; s++) {
            if (p.item.destinationId === stopNodes[s].id) {
              isDelivered = true;
              break;
            }
          }

          if (isDelivered) {
            box.scale.set(0, 0, 0);
          } else {
            box.scale.set(1, 1, 1);
          }
        });

        const segment = route.segments[segmentIdx];
        const grade = segment ? segment.slopePct : 0;

        setTelemetry({
          status: `Driving: ${startNode.name} ➔ ${endNode.name}`,
          weight: Math.max(0, Math.round(currentWeight)),
          segment: `${startNode.name} to ${endNode.name}`,
          slope: Number(grade.toFixed(1)),
        });

        controls.update();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animateRouting);
      };

      animateRouting();
    }

    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
    };
  }, [mounted, mode, isPlaying, speed, packing, route, stops, container]);

  if (!mounted) {
    return (
      <div className="card flex h-[400px] items-center justify-center bg-slate-900/40 text-slate-400">
        <svg className="h-8 w-8 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" fill="currentColor" className="opacity-75" />
        </svg>
        <span className="ml-3">Loading 3D WebGL Simulator...</span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-300">
            3D Pipeline Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Interactive WebGL simulation of the cargo loading and terrain-routing logistics.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-900/80 p-0.5 border border-slate-800">
          <button
            onClick={() => {
              setMode("packing");
              setIsPlaying(true);
            }}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === "packing"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📦 Cargo Packing
          </button>
          <button
            onClick={() => {
              setMode("routing");
              setIsPlaying(true);
            }}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === "routing"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🚚 Route Delivery
          </button>
        </div>
      </div>

      <div className="relative h-[420px] w-full rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="h-full w-full block cursor-grab active:cursor-grabbing" />

        <div className="absolute left-4 top-4 rounded-xl bg-slate-950/85 p-3.5 text-xs font-medium text-slate-300 border border-slate-800/60 backdrop-blur-md space-y-1.5 min-w-[200px] shadow-2xl">
          <h4 className="text-[10px] tracking-wider text-emerald-400 font-bold uppercase mb-1">
            Telemetry Feed
          </h4>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Status:</span>
            <span className="font-semibold text-white">{telemetry.status}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Weight Load:</span>
            <span className="font-semibold text-emerald-300">
              {telemetry.weight} kg
            </span>
          </div>
          {mode === "routing" && (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Slope:</span>
                <span
                  className={`font-semibold ${
                    telemetry.slope > 0
                      ? "text-rose-400"
                      : telemetry.slope < 0
                      ? "text-emerald-400"
                      : "text-slate-300"
                  }`}
                >
                  {telemetry.slope > 0 ? "+" : ""}
                  {telemetry.slope}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Segment:</span>
                <span className="font-semibold text-slate-400 text-right truncate max-w-[120px]">
                  {telemetry.segment}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-slate-950/80 p-1.5 border border-slate-800/60 backdrop-blur-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-xs font-semibold transition"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            className="rounded bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-semibold transition min-w-[36px]"
          >
            {speed}x
          </button>
        </div>

        <div className="absolute left-4 bottom-4 text-[10px] text-slate-500 pointer-events-none">
          🖱️ Click and drag to rotate view | Scroll to zoom
        </div>
      </div>
    </div>
  );
}
