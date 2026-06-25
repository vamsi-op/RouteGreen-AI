'use client';

import React from 'react';

interface SDGCard {
  number: string;
  color: string;
  name: string;
  description: string;
}

const sdgCards: SDGCard[] = [
  {
    number: '11',
    color: '#F99D26',
    name: 'Sustainable Cities & Communities',
    description:
      'Optimizes urban and peri-urban freight delivery by reducing truck trips through better packing and smarter routing, cutting traffic congestion and air pollution in communities along the North-East India corridor.',
  },
  {
    number: '12',
    color: '#CF8D2A',
    name: 'Responsible Consumption & Production',
    description:
      'Maximizes container volume utilization from 45% to 81.3%, reducing resource waste per delivery. The shifting-weight fuel model ensures every litre of diesel is used as efficiently as physics allows.',
  },
  {
    number: '13',
    color: '#48773E',
    name: 'Climate Action',
    description:
      'Directly reduces Scope 3 transport CO₂ emissions by 7.4% per dispatch through elevation-aware, load-dependent route optimization with a full segment-by-segment carbon audit trail aligned with GLEC standards.',
  },
];

export default function SDGSection() {
  return (
    <section className="section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Label */}
        <div className="flex justify-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            SDG Alignment
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="section-title">Aligned with Global Goals</h2>
        <p className="section-subtitle">
          RouteGreen AI directly contributes to three United Nations Sustainable
          Development Goals.
        </p>

        {/* SDG Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {sdgCards.map((sdg) => (
            <div
              key={sdg.number}
              className="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Colored Top Accent Bar */}
              <div
                className="h-1 rounded-t-2xl"
                style={{ backgroundColor: sdg.color }}
              />

              <div className="p-6 sm:p-8">
                {/* SDG Number */}
                <p
                  className="text-5xl font-black mb-3 transition-transform duration-300 group-hover:scale-105"
                  style={{ color: sdg.color }}
                >
                  {sdg.number}
                </p>

                {/* Goal Name */}
                <h3 className="text-lg font-semibold text-white mb-3">
                  {sdg.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">
                  {sdg.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { SDGSection };
