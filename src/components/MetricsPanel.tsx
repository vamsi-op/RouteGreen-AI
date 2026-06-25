import type { ComparisonRow } from "@/lib/types";

export function MetricsPanel({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="card overflow-hidden rounded-lg">
      <h2 className="mb-4 text-lg font-semibold text-emerald-300">
        Comparative Evaluation
      </h2>
      <div className="overflow-x-auto">
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
              const barWidth = Math.min(Math.abs(r.improvementPct), 100);
              return (
                <tr
                  key={r.metric}
                  className="border-l-2 border-transparent border-t border-t-slate-800 transition-colors hover:border-l-emerald-500/50 hover:bg-slate-800/40"
                >
                  <td className="py-3 pr-4 font-medium text-slate-200">
                    {r.metric}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                      <div
                        className={`h-full rounded-full ${
                          positive
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "bg-gradient-to-r from-rose-500 to-rose-400"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
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
      </div>
      <p className="mt-4 text-xs text-slate-400">
        RouteGreen optimises for <span className="text-emerald-300">fuel &amp; CO₂</span>,
        not raw distance. It deliberately accepts a slightly longer route when
        smarter elevation/load sequencing lowers total fuel burn — which is why
        distance can rise while emissions fall.
      </p>
    </div>
  );
}
