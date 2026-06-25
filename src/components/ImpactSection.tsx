'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Metric {
  value: number;
  suffix: string;
  label: string;
  subtitle: string;
  barPercent: number;
}

const metrics: Metric[] = [
  {
    value: 81.3,
    suffix: '%',
    label: 'Volume Utilization',
    subtitle: 'vs 45% traditional',
    barPercent: 81.3,
  },
  {
    value: 7.4,
    suffix: '%',
    label: 'Fuel Savings',
    subtitle: '2.6L diesel saved',
    barPercent: 7.4,
  },
  {
    value: 7.4,
    suffix: '%',
    label: 'CO₂ Reduction',
    subtitle: '6.9 kg CO₂e avoided',
    barPercent: 7.4,
  },
  {
    value: 4,
    suffix: '/4',
    label: 'ESG Audit Checks',
    subtitle: 'GRI 302/305 aligned',
    barPercent: 100,
  },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedMetricCard({ metric }: { metric: Metric }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const startAnimation = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = easedProgress * metric.value;
      setDisplayValue(currentValue);
      setBarWidth(easedProgress * metric.barPercent);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(metric.value);
        setBarWidth(metric.barPercent);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [hasAnimated, metric.value, metric.barPercent]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startAnimation]);

  const formatValue = (val: number): string => {
    if (metric.suffix === '/4') {
      return String(Math.round(val));
    }
    if (Number.isInteger(metric.value)) {
      return String(Math.round(val));
    }
    return val.toFixed(1);
  };

  return (
    <div ref={cardRef} className="card-glow group relative overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Animated Number */}
        <p className="text-4xl sm:text-5xl font-black text-emerald-400 mb-2 tabular-nums tracking-tight transition-transform duration-300 group-hover:scale-110">
          {formatValue(displayValue)}
          <span className="text-3xl sm:text-4xl">{metric.suffix}</span>
        </p>

        {/* Label */}
        <p className="text-sm font-semibold text-white mb-1">{metric.label}</p>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 mb-5">{metric.subtitle}</p>

        {/* Progress Bar */}
        <div className="w-full h-1 rounded-full bg-slate-800/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-none"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ImpactSection() {
  return (
    <section className="section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Label */}
        <div className="flex justify-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            Measured Impact
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="section-title">Results That Matter</h2>
        <p className="section-subtitle">
          Verified optimization results from the North-East India hill corridor
          sample dataset.
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {metrics.map((metric) => (
            <AnimatedMetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { ImpactSection };
