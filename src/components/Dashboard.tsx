"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { DEFAULT_CONTAINER } from "@/lib/data";
import { useOptimization } from "@/hooks/useOptimization";
import { useReport } from "@/hooks/useReport";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";
import { SectionHeader } from "./SectionHeader";
import { Spinner } from "./ui/Spinner";
import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { HowItWorks } from "./HowItWorks";
import { SDGSection } from "./SDGSection";
import { ImpactSection } from "./ImpactSection";
import { MetricsPanel } from "./MetricsPanel";
import { PackingView } from "./PackingView";
import { RouteMap } from "./RouteMap";
import { SegmentTable } from "./SegmentTable";
import { ReportPanel } from "./ReportPanel";
import { ResponsibleAI } from "./ResponsibleAI";

/**
 * Three.js is heavy (~0.5MB) and browser-only. Load it lazily so it never
 * bloats the initial bundle or breaks SSR.
 */
const ThreeSimulator = dynamic(
  () => import("./ThreeSimulator").then((mod) => mod.ThreeSimulator),
  {
    ssr: false,
    loading: () => (
      <div className="card flex h-96 items-center justify-center text-slate-400">
        <span className="flex items-center gap-2">
          <Spinner className="h-5 w-5 text-emerald-400" />
          Loading 3D simulator…
        </span>
      </div>
    ),
  },
);

export function Dashboard() {
  const optimization = useOptimization();
  const report = useReport();

  const { data, status, error, run } = optimization;

  // Reveal-on-scroll re-runs whenever the results (data) change.
  useScrollReveal(data);

  // Clear any stale ESG report whenever a fresh optimization succeeds.
  useEffect(() => {
    if (status === "loading") report.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const isLoading = status === "loading";

  return (
    <>
      <Navbar />

      <HeroSection />

      <section id="problem" aria-label="The problem">
        <ProblemSection />
      </section>

      <section id="how-it-works" aria-label="How it works">
        <HowItWorks />
      </section>

      <section id="sdg" aria-label="SDG alignment">
        <SDGSection />
      </section>

      {/* ── Live Dashboard ───────────────────────────── */}
      <section id="dashboard" className="section" aria-label="Live dashboard">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeader
              eyebrow="Live Dashboard"
              title="Optimization Results"
              subtitle="Real-time results from the 3D bin-packing and Genetic Algorithm routing engines running on the North-East India sample dataset."
              centered
            />
          </div>

          <div className="reveal mb-8 flex justify-center">
            <button
              type="button"
              onClick={run}
              disabled={isLoading}
              className="group rounded-xl border border-emerald-600/60 bg-emerald-600/10 px-6 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Optimising…
                </span>
              ) : (
                "⟳ Re-run Optimization"
              )}
            </button>
          </div>

          {status === "error" && (
            <div
              role="alert"
              className="mx-auto mb-6 flex max-w-xl flex-col items-center gap-3 rounded-xl border border-rose-700/60 bg-rose-900/20 p-5 text-center text-sm text-rose-200"
            >
              <p>{error ?? "Optimization failed."}</p>
              <button
                type="button"
                onClick={run}
                className="rounded-lg border border-rose-600/60 px-4 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/30"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && !data && (
            <div
              className="card flex items-center justify-center gap-3 text-center text-slate-400"
              role="status"
              aria-live="polite"
            >
              <Spinner className="h-8 w-8 text-emerald-400" />
              Running solvers…
            </div>
          )}

          {data && (
            <div className="space-y-8" aria-busy={isLoading}>
              <div className="reveal">
                <MetricsPanel rows={data.comparison} />
              </div>

              <div className="reveal grid gap-8 lg:grid-cols-2">
                <PackingView packing={data.packing} container={DEFAULT_CONTAINER} />
                <RouteMap route={data.optimized} stops={data.stops} />
              </div>

              <div className="reveal">
                <SegmentTable route={data.optimized} />
              </div>

              <div className="reveal">
                <ReportPanel
                  report={report.report}
                  loading={report.status === "loading"}
                  error={report.error}
                  onGenerate={report.generate}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3D Simulator ─────────────────────────────── */}
      {data && (
        <section
          id="simulator"
          className="section border-b border-t border-slate-900 bg-slate-900/10"
          aria-label="3D pipeline simulator"
        >
          <div className="mx-auto max-w-6xl px-5">
            <div className="reveal">
              <SectionHeader
                eyebrow="Interactive Simulation"
                title="3D Pipeline Simulator"
                subtitle="Interact with the full logistics cycle in 3D: watch cargo items pack into the truck container, and track the truck's weight change as it climbs and delivers packages along the hilly North-East India terrain."
                centered
              />
            </div>
            <div className="reveal">
              <ThreeSimulator
                packing={data.packing}
                route={data.optimized}
                stops={data.stops}
                container={DEFAULT_CONTAINER}
              />
            </div>
          </div>
        </section>
      )}

      <section id="impact" aria-label="Measured impact">
        <ImpactSection />
      </section>

      <section id="responsible-ai" aria-label="Responsible AI">
        <ResponsibleAI />
      </section>

      <SiteFooter />
    </>
  );
}
