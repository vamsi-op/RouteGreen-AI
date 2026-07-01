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

  // Build a closed polygon path for the territory fill
  const territoryD = pathD + " Z";

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold text-emerald-300">
        Carbon-Aware Route
      </h2>
      {/* Gradient border glow around the SVG */}
      <div className="rounded-xl p-[1px] bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby="routemap-title routemap-desc"
          className="w-full rounded-xl bg-slate-950"
        >
          <title id="routemap-title">Carbon-aware delivery route</title>
          <desc id="routemap-desc">
            {`Map of ${orderedStops.length} stops connected in the fuel-optimized delivery sequence, starting and ending at the depot.`}
          </desc>
          {/* SVG defs: glow filter and territory gradient */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="territoryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Semi-transparent gradient territory fill */}
          <path
            d={territoryD}
            fill="url(#territoryGrad)"
            stroke="none"
          />

          {/* Animated dashed route path with glow */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeDasharray="8 6"
            filter="url(#glow)"
            className="animate-dash"
          />

          {orderedStops.map((s, i) => {
            const p = points[i];
            const isDepot = i === 0;
            const label = `${i + 1}. ${s.name} (${s.elevation}m)`;
            // Estimate label width for the background rect
            const labelWidth = label.length * 6 + 8;
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
                {/* Rounded rect background behind label */}
                <rect
                  x={p.x + 7}
                  y={p.y - 7}
                  width={labelWidth}
                  height={16}
                  rx={4}
                  ry={4}
                  fill="rgba(2,6,23,0.75)"
                  stroke="rgba(51,65,85,0.5)"
                  strokeWidth={0.5}
                />
                <text
                  x={p.x + 11}
                  y={p.y + 4}
                  fontSize={11}
                  fill="#cbd5e1"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Sequence optimised to minimise load-dependent, slope-aware fuel burn —
        not raw distance.
      </p>
    </div>
  );
}
