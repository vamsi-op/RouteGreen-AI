"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONTAINER } from "@/lib/data";
import type { OptimizeResponse } from "@/lib/types";
import type { AgentReport } from "@/lib/watsonx";
import { MetricsPanel } from "./MetricsPanel";
import { PackingView } from "./PackingView";
import { RouteMap } from "./RouteMap";
import { SegmentTable } from "./SegmentTable";
import { ReportPanel } from "./ReportPanel";

export function Dashboard() {
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [report, setReport] = useState<AgentReport | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function optimize() {
    setLoadingOpt(true);
    setError(null);
    try {
      const res = await fetch("/api/optimize", { method: "GET" });
      if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
      setData((await res.json()) as OptimizeResponse);
      setReport(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingOpt(false);
    }
  }

  async function runAgents() {
    setLoadingReport(true);
    try {
      const res = await fetch("/api/report", { method: "GET" });
      if (!res.ok) throw new Error(`Report failed: ${res.status}`);
      const json = (await res.json()) as { report: AgentReport };
      setReport(json.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    optimize();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            RouteGreen<span className="text-emerald-400"> AI</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Hybrid AI + Operations Research platform for carbon-aware fleet
            routing and 3D cargo load optimization. SDG 12 · 13 · 11.
          </p>
        </div>
        <button
          onClick={optimize}
          disabled={loadingOpt}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/10 disabled:opacity-50"
        >
          {loadingOpt ? "Optimising…" : "Re-run Optimization"}
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-700 bg-rose-900/30 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loadingOpt && !data && (
        <div className="card text-slate-400">Running solvers…</div>
      )}

      {data && (
        <div className="space-y-6">
          <MetricsPanel rows={data.comparison} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PackingView packing={data.packing} container={DEFAULT_CONTAINER} />
            <RouteMap route={data.optimized} stops={data.stops} />
          </div>

          <SegmentTable route={data.optimized} />

          <ReportPanel
            report={report}
            loading={loadingReport}
            onGenerate={runAgents}
          />
        </div>
      )}

      <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
        RouteGreen AI · Next.js 15 · IBM Granite watsonx.ai · 3D-BPP + Genetic
        VRP
      </footer>
    </main>
  );
}
