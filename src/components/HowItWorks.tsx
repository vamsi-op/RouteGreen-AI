"use client";

import React from "react";

interface PipelineStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  metric: string;
}

const steps: PipelineStep[] = [
  {
    number: "01",
    title: "3D Bin Packing",
    subtitle: "Extreme-Point First-Fit-Decreasing",
    description:
      "Items sorted by volume are packed into the truck using 6 axis-aligned orientations. The algorithm minimizes wasted space while respecting weight limits and keeping the center of mass low for stability.",
    metric: "81.3% volume efficiency",
  },
  {
    number: "02",
    title: "Carbon-Aware Routing",
    subtitle: "Genetic Algorithm VRP",
    description:
      "A Genetic Algorithm evolves delivery sequences using a slope-sensitive, load-dependent fuel model. Cargo weight drops at each stop, so the order of deliveries changes total fuel burned. The GA finds the optimal sequence.",
    metric: "7.4% fuel reduction",
  },
  {
    number: "03",
    title: "ESG Compliance Audit",
    subtitle: "IBM Granite Multi-Agent QA",
    description:
      "An Eco-Auditor agent validates load limits and emission ledgers. An Executive Reporting Agent (powered by IBM Granite-3-8b-instruct) drafts audit-ready ESG compliance summaries aligned with GRI 302/305.",
    metric: "4 audit checks passed",
  },
];

export function HowItWorks() {
  return (
    <section className="section relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex justify-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider uppercase">
            How It Works
          </span>
        </div>

        {/* Title */}
        <h2 className="section-title">Three-Stage Optimization Pipeline</h2>

        {/* Subtitle */}
        <p className="section-subtitle">
          From cargo loading to route sequencing to ESG compliance — each stage
          feeds into the next.
        </p>

        {/* Pipeline steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14 relative">
          {/* Connector lines (visible on lg screens) */}
          <div className="hidden lg:block absolute top-20 left-[33.33%] w-px h-0">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-[calc(100%-2rem)] h-px bg-gradient-to-r from-emerald-500/60 to-emerald-400/60" />
            </div>
          </div>

          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              {/* Connector arrow between cards on lg screens */}
              {i > 0 && (
                <div className="hidden lg:flex absolute items-center justify-center" style={{
                  top: "4.5rem",
                  left: `${(i * 33.33) - 2}%`,
                  width: "4%",
                }}>
                  <svg className="w-6 h-6 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}

              {/* Step card */}
              <div className={`card group relative reveal reveal-delay-${i + 1}`}>
                {/* Step number circle */}
                <div className="animate-float-slow mb-6 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-1">
                  {step.title}
                </h3>

                {/* Subtitle */}
                <p className="text-emerald-400 text-sm font-medium mb-4">
                  {step.subtitle}
                </p>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Key metric pill */}
                <div className="mt-auto">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {step.metric}
                  </span>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-emerald-500/5 to-transparent" />
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Pipeline flow line (mobile fallback — vertical connector) */}
        <div className="lg:hidden flex justify-center -mt-4 mb-2">
          <div className="w-px h-0 bg-gradient-to-b from-emerald-500/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
