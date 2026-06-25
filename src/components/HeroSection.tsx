"use client";

import React from "react";

const floatingDots = [
  { size: "w-3 h-3", top: "top-[15%]", left: "left-[10%]", opacity: "opacity-30", delay: "0s", className: "animate-float" },
  { size: "w-5 h-5", top: "top-[25%]", left: "left-[85%]", opacity: "opacity-20", delay: "1s", className: "animate-float" },
  { size: "w-2 h-2", top: "top-[60%]", left: "left-[5%]", opacity: "opacity-40", delay: "0.5s", className: "animate-pulse-glow" },
  { size: "w-4 h-4", top: "top-[70%]", left: "left-[90%]", opacity: "opacity-25", delay: "1.5s", className: "animate-float" },
  { size: "w-6 h-6", top: "top-[40%]", left: "left-[3%]", opacity: "opacity-15", delay: "2s", className: "animate-pulse-glow" },
  { size: "w-2 h-2", top: "top-[80%]", left: "left-[75%]", opacity: "opacity-35", delay: "0.8s", className: "animate-float" },
  { size: "w-3 h-3", top: "top-[10%]", left: "left-[50%]", opacity: "opacity-20", delay: "2.5s", className: "animate-pulse-glow" },
  { size: "w-4 h-4", top: "top-[50%]", left: "left-[95%]", opacity: "opacity-30", delay: "1.2s", className: "animate-float" },
];

const techStack = [
  "Next.js 15",
  "IBM Granite",
  "TypeScript",
  "Genetic Algorithm",
  "3D-BPP",
];

export function HeroSection() {
  return (
    <section className="hero-gradient relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Floating decorative dots */}
      {floatingDots.map((dot, i) => (
        <div
          key={i}
          className={`absolute ${dot.size} ${dot.top} ${dot.left} ${dot.opacity} ${dot.className} rounded-full bg-emerald-400`}
          style={{ animationDelay: dot.delay }}
          aria-hidden="true"
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* SDG Badges */}
        <div
          className="flex flex-wrap justify-center gap-3 mb-8"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.1s" }}
        >
          <span className="sdg-badge sdg-11">SDG 11</span>
          <span className="sdg-badge sdg-12">SDG 12</span>
          <span className="sdg-badge sdg-13">SDG 13</span>
        </div>

        {/* Title */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.25s" }}
        >
          <span className="text-white">RouteGreen</span>
          <span className="gradient-text"> AI</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-xl text-slate-300 mb-4 max-w-2xl"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.4s" }}
        >
          Carbon-Aware Fleet Routing &amp; 3D Cargo Load Optimization Platform
        </p>

        {/* Description */}
        <p
          className="text-slate-400 max-w-2xl mb-10 leading-relaxed"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.55s" }}
        >
          Hybrid AI + Operations Research platform that concurrently solves 3D cargo
          packing and slope-aware, load-dependent vehicle routing, with an IBM
          Granite multi-agent QA layer producing audit-ready ESG reports.
        </p>

        {/* Buttons */}
        <div
          className="flex flex-wrap justify-center gap-4 mb-14"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.7s" }}
        >
          <a
            href="#dashboard"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl px-8 py-3 transition-colors duration-200 shadow-lg shadow-emerald-500/25"
          >
            Explore Dashboard ↓
          </a>
          <a
            href="https://github.com/vamsi-op/RouteGreen-AI.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold rounded-xl px-6 py-3 transition-colors duration-200"
          >
            View on GitHub
          </a>
        </div>

        {/* Tech Stack */}
        <div
          className="flex flex-wrap justify-center gap-2"
          style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "0.85s" }}
        >
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-slate-800/60 border border-slate-700 text-xs text-slate-400 px-3 py-1"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
        style={{ animation: "fadeInUp 0.7s ease-out both", animationDelay: "1.1s" }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg
          className="w-5 h-5 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Inline keyframes for fade-in-up */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
