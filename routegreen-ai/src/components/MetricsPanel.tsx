import type { ComparisonRow } from "@/lib/types";

export function MetricsPanel({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-4 text-lg font-semibold text-emerald-300">
        Comparative Evaluation
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="py-2 pr-4 font-medium">Metric</th>
            <th className="py-2 pr-4 font-medium">Traditional</th>
            <th className="py-2 pr-4 font-medium">RouteGreen AI</th>
            <th className="py-2 pr-4 font-medium">Improvement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isUtil = r.metric === "Volume Utilization";
            const positive = r.improvementPct > 0;
            return (
              <tr key={r.metric} className="border-t border-slate-800">
                <td className="py-3 pr-4 font-medium text-slate-200">{r.metric}</td>
                <td className="py-3 pr-4 tabular-nums text-slate-300">
                  {r.traditional}
                  {r.unit}
                </td>
                <td className="py-3 pr-4 tabular-nums font-semibold text-emerald-300">
                  {r.routeGreen}
                  {r.unit}
                </td>
                <td
                  className={`py-3 pr-4 tabular-nums font-semibold ${
                    positive ? "metric-up" : "metric-down"
                  }`}
                >
                  {positive ? "▲" : "▼"} {Math.abs(r.improvementPct)}
                  {isUtil ? " pts" : "%"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-slate-400">
        RouteGreen optimises for <span className="text-emerald-300">fuel &amp; CO₂</span>,
        not raw distance. It deliberately accepts a slightly longer route when
        smarter elevation/load sequencing lowers total fuel burn — which is why
        distance can rise while emissions fall.
      </p>
    </div>
  );
}
