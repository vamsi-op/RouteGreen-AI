"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DEFAULT_CONTAINER } from "@/lib/data";
import type { OptimizeResponse } from "@/lib/types";
import type { AgentReport } from "@/lib/watsonx";
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
import { ThreeSimulator } from "./ThreeSimulator";

/* ── Scroll-reveal hook ──────────────────────────────── */
function useScrollReveal(trigger?: any) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [trigger]);
}

/* ── Sticky navbar ───────────────────────────────────── */
const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "SDGs", href: "#sdg" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "3D Simulator", href: "#simulator" },
  { label: "Impact", href: "#impact" },
  { label: "Responsible AI", href: "#responsible-ai" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);

      // Determine active section
      const sections = NAV_LINKS.map((l) => l.href.slice(1));
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) current = id;
        }
      }
      setActive(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#" className="text-lg font-bold text-white">
          RouteGreen<span className="text-emerald-400"> AI</span>
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                active === link.href.slice(1) ? "nav-link-active" : "nav-link"
              }
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="https://github.com/vamsi-op/RouteGreen-AI.git"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-400 sm:inline-block"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}

/* ── Main Dashboard ──────────────────────────────────── */
export function Dashboard() {
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [report, setReport] = useState<AgentReport | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useScrollReveal(data);

  const optimize = useCallback(async () => {
    setLoadingOpt(true);
    setError(null);
    try {
      // Artificial delay to make optimization visually visible
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await fetch("/api/optimize", { method: "GET" });
      if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
      setData((await res.json()) as OptimizeResponse);
      setReport(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingOpt(false);
    }
  }, []);

  const runAgents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    optimize();
  }, [optimize]);

  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <HeroSection />

      {/* ── Problem ──────────────────────────────────── */}
      <div id="problem">
        <ProblemSection />
      </div>

      {/* ── How It Works ─────────────────────────────── */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* ── SDG Alignment ────────────────────────────── */}
      <div id="sdg">
        <SDGSection />
      </div>

      {/* ── Live Dashboard ───────────────────────────── */}
      <div id="dashboard" className="section">
        <div className="mx-auto max-w-6xl px-5">
          {/* Section header */}
          <div className="reveal mb-10 text-center">
            <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Dashboard
            </span>
            <h2 className="section-title mt-4">Optimization Results</h2>
            <p className="section-subtitle mx-auto text-center">
              Real-time results from the 3D bin-packing and Genetic Algorithm
              routing engines running on the North-East India sample dataset.
            </p>
          </div>

          {/* Re-run button */}
          <div className="reveal mb-8 flex justify-center">
            <button
              onClick={optimize}
              disabled={loadingOpt}
              className="group rounded-xl border border-emerald-600/60 bg-emerald-600/10 px-6 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50"
            >
              {loadingOpt ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  Optimising…
                </span>
              ) : (
                "⟳ Re-run Optimization"
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-700/60 bg-rose-900/20 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {loadingOpt && !data && (
            <div className="card text-center text-slate-400">
              <svg
                className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                  fill="currentColor"
                  className="opacity-75"
                />
              </svg>
              Running solvers…
            </div>
          )}

          {data && (
            <div className="space-y-8">
              <div className="reveal">
                <MetricsPanel rows={data.comparison} />
              </div>

              <div className="reveal grid gap-8 lg:grid-cols-2">
                <PackingView
                  packing={data.packing}
                  container={DEFAULT_CONTAINER}
                />
                <RouteMap route={data.optimized} stops={data.stops} />
              </div>

              <div className="reveal">
                <SegmentTable route={data.optimized} />
              </div>

              <div className="reveal">
                <ReportPanel
                  report={report}
                  loading={loadingReport}
                  onGenerate={runAgents}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3D Simulator ─────────────────────────────── */}
      {data && (
        <div id="simulator" className="section bg-slate-900/10 border-t border-b border-slate-900">
          <div className="mx-auto max-w-6xl px-5">
            <div className="reveal mb-10 text-center">
              <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Interactive Simulation
              </span>
              <h2 className="section-title mt-4">3D Pipeline Simulator</h2>
              <p className="section-subtitle mx-auto text-center">
                {"Interact with the full logistics cycle in 3D: watch cargo items pack into the truck container, and track the truck's weight change as it climbs and delivers packages along the hilly North-East India terrain."}
              </p>
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
        </div>
      )}

      {/* ── Impact ───────────────────────────────────── */}
      <div id="impact">
        <ImpactSection />
      </div>

      {/* ── Responsible AI ───────────────────────────── */}
      <div id="responsible-ai">
        <ResponsibleAI />
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 bg-slate-950">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Logo */}
            <h3 className="text-xl font-bold text-white">
              RouteGreen<span className="text-emerald-400"> AI</span>
            </h3>

            {/* Attribution */}
            <p className="max-w-lg text-sm text-slate-400">
              Built for the{" "}
              <span className="font-medium text-slate-300">
                1M1B × IBM SkillsBuild × AICTE
              </span>{" "}
              AI for Sustainability Virtual Internship.
            </p>

            {/* Tech stack badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Next.js 15",
                "React 19",
                "TypeScript",
                "IBM Granite",
                "watsonx.ai",
                "3D-BPP",
                "Genetic Algorithm VRP",
                "Tailwind CSS",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1 text-xs text-slate-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* SDG badges */}
            <div className="flex gap-3">
              <span className="sdg-badge sdg-11">SDG 11</span>
              <span className="sdg-badge sdg-12">SDG 12</span>
              <span className="sdg-badge sdg-13">SDG 13</span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-slate-600">
              © 2026 RouteGreen AI. Carbon-Aware Fleet Routing & 3D Cargo
              Optimization.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
