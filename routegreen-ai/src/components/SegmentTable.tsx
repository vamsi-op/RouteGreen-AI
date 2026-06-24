import type { RouteResult } from "@/lib/types";

/** Segment-by-segment audit trail (transparency pillar, proposal section 11). */
export function SegmentTable({ route }: { route: RouteResult }) {
  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-4 text-lg font-semibold text-emerald-300">
        Segment Audit Trail
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="py-2 pr-4 font-medium">Segment</th>
            <th className="py-2 pr-4 font-medium">Dist (km)</th>
            <th className="py-2 pr-4 font-medium">Slope (%)</th>
            <th className="py-2 pr-4 font-medium">Load (kg)</th>
            <th className="py-2 pr-4 font-medium">Fuel (L)</th>
            <th className="py-2 pr-4 font-medium">CO₂ (kg)</th>
          </tr>
        </thead>
        <tbody>
          {route.segments.map((s, i) => (
            <tr key={i} className="border-t border-slate-800">
              <td className="py-2 pr-4 font-medium text-slate-200">
                {s.fromId} → {s.toId}
              </td>
              <td className="py-2 pr-4 tabular-nums">{s.distanceKm.toFixed(1)}</td>
              <td
                className={`py-2 pr-4 tabular-nums ${
                  s.slopePct >= 0 ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {s.slopePct >= 0 ? "+" : ""}
                {s.slopePct.toFixed(2)}
              </td>
              <td className="py-2 pr-4 tabular-nums">{s.cargoWeightKg.toFixed(0)}</td>
              <td className="py-2 pr-4 tabular-nums">{s.fuelLiters.toFixed(2)}</td>
              <td className="py-2 pr-4 tabular-nums">{s.co2Kg.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-700 font-semibold text-emerald-300">
            <td className="py-2 pr-4">Total</td>
            <td className="py-2 pr-4 tabular-nums">
              {route.totalDistanceKm.toFixed(1)}
            </td>
            <td className="py-2 pr-4">—</td>
            <td className="py-2 pr-4">—</td>
            <td className="py-2 pr-4 tabular-nums">
              {route.totalFuelLiters.toFixed(2)}
            </td>
            <td className="py-2 pr-4 tabular-nums">
              {route.totalCo2Kg.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
