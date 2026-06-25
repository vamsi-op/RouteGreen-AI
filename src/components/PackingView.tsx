"use client";

import { useEffect, useRef } from "react";
import type { PackingResult, Container } from "@/lib/types";

const PALETTE = [
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
  "#facc15",
];

/** Isometric projection of a 3D point onto the 2D canvas. */
function iso(x: number, y: number, z: number, scale: number) {
  const angle = Math.PI / 6; // 30 degrees
  const sx = (x - z) * Math.cos(angle) * scale;
  const sy = ((x + z) * Math.sin(angle) - y) * scale;
  return { sx, sy };
}

export function PackingView({
  packing,
  container,
}: {
  packing: PackingResult;
  container: Container;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const maxDim = Math.max(container.W, container.H, container.D);
    const scale = (Math.min(W, H) / (maxDim * 2.4)) * 1.1;
    const ox = W / 2;
    const oy = H * 0.62;

    const project = (x: number, y: number, z: number) => {
      const { sx, sy } = iso(x, y, z, scale);
      return { px: ox + sx, py: oy + sy };
    };

    // Draw container wireframe
    const c = container;
    const corners = [
      [0, 0, 0],
      [c.W, 0, 0],
      [c.W, 0, c.D],
      [0, 0, c.D],
      [0, c.H, 0],
      [c.W, c.H, 0],
      [c.W, c.H, c.D],
      [0, c.H, c.D],
    ].map(([x, y, z]) => project(x, y, z));

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(corners[a].px, corners[a].py);
      ctx.lineTo(corners[b].px, corners[b].py);
      ctx.stroke();
    });

    // Sort placements back-to-front for painter's algorithm.
    const sorted = [...packing.placements].sort(
      (p, q) => q.x + q.z + q.y - (p.x + p.z + p.y)
    );

    sorted.forEach((p, i) => {
      const color = PALETTE[i % PALETTE.length];
      drawBox(ctx, project, p.x, p.y, p.z, p.w, p.h, p.d, color);
    });

    function drawBox(
      ctx: CanvasRenderingContext2D,
      proj: (x: number, y: number, z: number) => { px: number; py: number },
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string
    ) {
      const v = {
        a: proj(x, y, z),
        b: proj(x + w, y, z),
        c: proj(x + w, y, z + d),
        d: proj(x, y, z + d),
        e: proj(x, y + h, z),
        f: proj(x + w, y + h, z),
        g: proj(x + w, y + h, z + d),
        h: proj(x, y + h, z + d),
      };

      // top face
      face(ctx, [v.e, v.f, v.g, v.h], shade(color, 1.0));
      // right face
      face(ctx, [v.b, v.c, v.g, v.f], shade(color, 0.78));
      // front face
      face(ctx, [v.d, v.c, v.g, v.h], shade(color, 0.62));
    }

    function face(
      ctx: CanvasRenderingContext2D,
      pts: Array<{ px: number; py: number }>,
      fill: string
    ) {
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].py);
      pts.slice(1).forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(2,6,23,0.55)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }

    function shade(hex: string, factor: number): string {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(
        b * factor
      )})`;
    }
  }, [packing, container]);

  const totalWeight = packing.placements.reduce(
    (sum, p) => sum + p.item.weight,
    0
  );
  const maxWeight = container.maxWeight;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-300">
          3D Cargo Load Plan
        </h2>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
          {packing.volumeEfficiency.toFixed(1)}% filled
        </span>
      </div>
      {/* Gradient border glow around the canvas */}
      <div className="rounded-xl p-[1px] bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/10">
        <canvas
          ref={canvasRef}
          width={520}
          height={360}
          className="w-full rounded-xl bg-slate-950"
        />
      </div>
      {/* Weight capacity label */}
      <p className="mt-2 text-center text-xs text-slate-400">
        Total: {totalWeight.toFixed(1)} kg / {maxWeight} kg capacity
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-3">
        {packing.placements.map((p, i) => (
          <li key={p.item.id} className="flex items-center gap-2.5">
            <span
              className="inline-block h-3.5 w-3.5 rounded-sm ring-1 ring-white/10"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            {p.item.label} ({p.item.weight} kg)
          </li>
        ))}
        {packing.unplaced.map((u) => (
          <li key={u.id} className="flex items-center gap-2.5 text-rose-400">
            <span className="inline-block h-3.5 w-3.5 rounded-sm bg-rose-500 ring-1 ring-white/10" />
            {u.label} — unplaced
          </li>
        ))}
      </ul>
    </div>
  );
}
