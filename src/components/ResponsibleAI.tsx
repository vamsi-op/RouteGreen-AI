'use client';

import React from 'react';

interface Pillar {
  icon: string;
  title: string;
  description: string;
}

const pillars: Pillar[] = [
  {
    icon: '⚖️',
    title: 'Fairness',
    description:
      'Route scoring relies exclusively on physical variables — distance, road grade, and cargo weight. No demographic, socioeconomic, or otherwise biased variables are used in any optimization decision.',
  },
  {
    icon: '🔍',
    title: 'Transparency',
    description:
      'The optimization pipeline is fully deterministic and auditable. Every route decision can be traced through the segment-by-segment audit trail showing exactly why each delivery sequence was chosen.',
  },
  {
    icon: '🛡️',
    title: 'Ethics',
    description:
      'The system is designed solely for environmental benefit — reducing fuel waste and carbon emissions. It produces no harmful, discriminatory, or misleading outputs and operates within responsible AI guidelines.',
  },
  {
    icon: '🔒',
    title: 'Privacy',
    description:
      'All location coordinates and cargo packages in the prototype are simulated and anonymous. No personal data, commercial secrets, or sensitive information is collected, stored, or processed.',
  },
];

export default function ResponsibleAI() {
  return (
    <section className="section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Label */}
        <div className="flex justify-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            Responsible AI
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="section-title">Built with Ethics in Mind</h2>
        <p className="section-subtitle">
          Every project must address fairness, transparency, ethics, and privacy.
          Here is how RouteGreen AI meets these principles.
        </p>

        {/* Pillar Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="p-6 sm:p-8">
                {/* Icon with emerald-tinted background */}
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-emerald-500/20 group-hover:scale-110">
                  <span className="text-3xl" role="img" aria-label={pillar.title}>
                    {pillar.icon}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-3">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-slate-800/60">
          <p className="text-sm text-slate-500 italic text-center">
            RouteGreen AI follows the IBM AI Ethics principles and the 1M1B
            Responsible AI Guidelines.
          </p>
        </div>
      </div>
    </section>
  );
}

export { ResponsibleAI };
