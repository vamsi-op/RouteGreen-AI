"use client";

import React from "react";

interface ProblemCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const problems: ProblemCard[] = [
  {
    icon: (
      <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: "Inefficient Packing",
    description:
      "Manual cargo loading achieves only ~45% volume utilisation, wasting truck capacity and increasing the number of trips required.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: "Distance-Only Routing",
    description:
      "GPS routing minimizes distance but ignores elevation and cargo weight — pulling heavy loads uphill burns 20-30% more fuel.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "No Emission Auditing",
    description:
      "Most logistics operations lack segment-level CO₂ tracking needed for Scope 3 reporting under GRI 302/305 and CSRD standards.",
  },
];

export function ProblemSection() {
  return (
    <section className="section relative">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex justify-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider uppercase">
            The Problem
          </span>
        </div>

        {/* Title */}
        <h2 className="section-title">Why Traditional Logistics Falls Short</h2>

        {/* Subtitle */}
        <p className="section-subtitle">
          Transport accounts for ~16% of global greenhouse gas emissions.
          Traditional fleet routing optimizes for distance alone, ignoring the
          physics of fuel consumption.
        </p>

        {/* Problem cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-14">
          {problems.map((problem, i) => (
            <div
              key={problem.title}
              className={`card group reveal reveal-delay-${i + 1}`}
            >
              {/* Icon */}
              <div className="mb-5 w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-300">
                {problem.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-3">
                {problem.title}
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        {/* How might we statement */}
        <div className="relative max-w-3xl mx-auto">
          <div className="border-l-4 border-emerald-500 bg-slate-900/40 backdrop-blur-sm rounded-r-xl px-8 py-6">
            <p className="italic text-emerald-300 leading-relaxed text-lg">
              &ldquo;How might we use AI to optimize cargo load packing and
              delivery route sequencing so that transport-related fuel usage and
              Scope 3 carbon emissions can be minimized?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
