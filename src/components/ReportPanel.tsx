"use client";

import type { AgentReport } from "@/lib/watsonx";
import { Spinner } from "./ui/Spinner";

export function ReportPanel({
  report,
  loading,
  error,
  onGenerate,
}: {
  report: AgentReport | null;
  loading: boolean;
  error?: string | null;
  onGenerate: () => void;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-emerald-300">
          IBM Granite QA &amp; ESG Report
        </h2>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 motion-reduce:hover:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner className="h-4 w-4" />}
          {loading ? "Generating…" : "Run Agents"}
        </button>
      </div>

      {!report && !loading && !error && (
        <p className="text-sm text-slate-400">
          Run the multi-agent network to audit the optimization and draft the
          ESG compliance statement.
        </p>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-rose-700/60 bg-rose-900/20 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="mb-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                report.source === "watsonx"
                  ? "border border-blue-500/20 bg-blue-500/15 text-blue-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {report.source === "watsonx"
                ? `Live watsonx.ai · ${report.modelId}`
                : "Local fallback (no watsonx key configured)"}
            </span>
          </div>

          <div className="glass mb-4 rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Eco-Auditor Findings
            </h3>
            <ul className="space-y-1 text-sm">
              {report.audit.map((line, i) => {
                const passed = line.startsWith("PASS");
                return (
                  <li
                    key={i}
                    className={passed ? "text-emerald-300" : "text-amber-300"}
                  >
                    <span className="mr-1.5" aria-hidden="true">
                      {passed ? "✓" : "⚠"}
                    </span>
                    {line}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Executive Reporting Agent
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {report.text}
            </p>
            {report.source === "watsonx" && (
              <p className="mt-3 border-t border-blue-500/20 pt-2 text-xs text-blue-400/80">
                Powered by IBM Granite · {report.modelId}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
