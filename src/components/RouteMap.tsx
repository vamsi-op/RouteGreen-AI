"use client";

import type { RouteResult, Stop } from "@/lib/types";

/** Projects lat/lng into an SVG viewbox and draws the optimized tour. */
export function RouteMap({
  route,
  stops,
}: {
  route: RouteResult;
  stops: Stop[];
}) {
  const width = 520;
  const height = 360;
  const pad = 40;

  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const project = (s: Stop) => {
    const x =
      pad + ((s.lng - minLng) / (maxLng - minLng || 1)) * (width - 2 * pad);
    // invert lat so north is up
    const y =
      pad + ((maxLat - s.lat) / (maxLat - minLat || 1)) * (height - 2 * pad);
    return { x, y };
  };

  const orderedStops = route.order
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is Stop => Boolean(s));

  const points = orderedStops.map(project);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold text-emerald-300">
        Carbon-Aware Route
      </h2>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-lg bg-slate-950"
      >
        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
        {orderedStops.map((s, i) => {
          const p = points[i];
          const isDepot = i === 0;
          return (
            <g key={`${s.id}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isDepot ? 8 : 6}
                fill={isDepot ? "#fbbf24" : "#34d399"}
                stroke="#020617"
                strokeWidth={2}
              />
              <text
                x={p.x + 10}
                y={p.y + 4}
                fontSize={11}
                fill="#cbd5e1"
              >
                {i + 1}. {s.name} ({s.elevation}m)
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-3 text-xs text-slate-400">
        Sequence optimised to minimise load-dependent, slope-aware fuel burn —
        not raw distance.
      </p>
    </div>
  );
}
