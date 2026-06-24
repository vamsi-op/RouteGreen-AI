"use client";

import type { AgentReport } from "@/lib/watsonx";

export function ReportPanel({
  report,
  loading,
  onGenerate,
}: {
  report: AgentReport | null;
  loading: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-300">
          IBM Granite QA &amp; ESG Report
        </h2>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Run Agents"}
        </button>
      </div>

      {!report && !loading && (
        <p className="text-sm text-slate-400">
          Run the multi-agent network to audit the optimization and draft the
          ESG compliance statement.
        </p>
      )}

      {report && (
        <>
          <div className="mb-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                report.source === "watsonx"
                  ? "bg-blue-500/15 text-blue-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {report.source === "watsonx"
                ? `Live watsonx.ai · ${report.modelId}`
                : "Local fallback (no watsonx key configured)"}
            </span>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Eco-Auditor Findings
          </h3>
          <ul className="mb-4 space-y-1 text-sm">
            {report.audit.map((a, i) => (
              <li
                key={i}
                className={
                  a.startsWith("PASS")
                    ? "text-emerald-300"
                    : "text-amber-300"
                }
              >
                {a}
              </li>
            ))}
          </ul>

          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Executive Reporting Agent
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {report.text}
          </p>
        </>
      )}
    </div>
  );
}
