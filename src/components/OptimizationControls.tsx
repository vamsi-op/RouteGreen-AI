'use client';

import { useState } from 'react';
import type { CargoItem } from '@/lib/types';
import { SAMPLE_CARGO } from '@/lib/data';

interface OptimizationControlsProps {
  onRun: (params: { cargo?: CargoItem[]; gaParams?: GAParams }) => void;
  isLoading: boolean;
}

interface GAParams {
  populationSize: number;
  generations: number;
  mutationRate: number;
}

const DEFAULT_GA_PARAMS: GAParams = {
  populationSize: 100,
  generations: 200,
  mutationRate: 0.15,
};

export function OptimizationControls({ onRun, isLoading }: OptimizationControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCargo, setShowCargo] = useState(false);
  
  // GA Parameters
  const [gaParams, setGaParams] = useState<GAParams>(DEFAULT_GA_PARAMS);
  
  // Cargo Items (starting with sample cargo)
  const [cargo, setCargo] = useState<CargoItem[]>(SAMPLE_CARGO);

  const handleRun = () => {
    onRun({
      cargo: showCargo ? cargo : undefined,
      gaParams: showAdvanced ? gaParams : undefined,
    });
  };

  const addCargoItem = () => {
    const newId = `custom-${Date.now()}`;
    const newItem: CargoItem = {
      id: newId,
      label: `Box ${cargo.length + 1}`,
      w: 1.0,
      h: 0.8,
      d: 0.6,
      weight: 50,
      destinationId: 'stop-2', // Default destination
    };
    setCargo([...cargo, newItem]);
  };

  const removeCargoItem = (id: string) => {
    setCargo(cargo.filter(item => item.id !== id));
  };

  const updateCargoItem = (id: string, field: keyof CargoItem, value: string | number) => {
    setCargo(cargo.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const resetToDefaults = () => {
    setGaParams(DEFAULT_GA_PARAMS);
    setCargo(SAMPLE_CARGO);
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Optimization Controls</h3>
        <button
          type="button"
          onClick={resetToDefaults}
          className="text-xs text-slate-400 hover:text-emerald-400 transition"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Cargo Items Section */}
      <div className="border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => setShowCargo(!showCargo)}
          className="flex w-full items-center justify-between text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>📦 Cargo Items ({cargo.length})</span>
          <span>{showCargo ? '▼' : '▶'}</span>
        </button>
        
        {showCargo && (
          <div className="mt-4 space-y-3">
            {cargo.map((item, idx) => (
              <div key={item.id} className="border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateCargoItem(item.id, 'label', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white flex-1 mr-2 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeCargoItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col">
                    <span className="text-slate-400 mb-1">Weight (kg)</span>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateCargoItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
                      step="0.1"
                    />
                  </label>
                  
                  <label className="flex flex-col">
                    <span className="text-slate-400 mb-1">Width (m)</span>
                    <input
                      type="number"
                      value={item.w}
                      onChange={(e) => updateCargoItem(item.id, 'w', parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
                      step="0.1"
                    />
                  </label>
                  
                  <label className="flex flex-col">
                    <span className="text-slate-400 mb-1">Height (m)</span>
                    <input
                      type="number"
                      value={item.h}
                      onChange={(e) => updateCargoItem(item.id, 'h', parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
                      step="0.1"
                    />
                  </label>
                  
                  <label className="flex flex-col">
                    <span className="text-slate-400 mb-1">Depth (m)</span>
                    <input
                      type="number"
                      value={item.d}
                      onChange={(e) => updateCargoItem(item.id, 'd', parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
                      step="0.1"
                    />
                  </label>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCargoItem}
              className="w-full border border-dashed border-slate-700 rounded-lg py-2 text-sm text-slate-400 hover:text-emerald-400 hover:border-emerald-500 transition"
            >
              + Add Cargo Item
            </button>
          </div>
        )}
      </div>

      {/* GA Parameters Section */}
      <div className="border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>⚙️ Genetic Algorithm Parameters</span>
          <span>{showAdvanced ? '▼' : '▶'}</span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-3">
            <label className="flex flex-col text-xs">
              <span className="text-slate-400 mb-1">Population Size</span>
              <input
                type="number"
                value={gaParams.populationSize}
                onChange={(e) => setGaParams({ ...gaParams, populationSize: parseInt(e.target.value) || 100 })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                min="10"
                max="500"
              />
              <span className="text-slate-500 mt-1">Number of solutions per generation (10-500)</span>
            </label>
            
            <label className="flex flex-col text-xs">
              <span className="text-slate-400 mb-1">Generations</span>
              <input
                type="number"
                value={gaParams.generations}
                onChange={(e) => setGaParams({ ...gaParams, generations: parseInt(e.target.value) || 200 })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                min="10"
                max="1000"
              />
              <span className="text-slate-500 mt-1">Number of evolution iterations (10-1000)</span>
            </label>
            
            <label className="flex flex-col text-xs">
              <span className="text-slate-400 mb-1">Mutation Rate</span>
              <input
                type="number"
                value={gaParams.mutationRate}
                onChange={(e) => setGaParams({ ...gaParams, mutationRate: parseFloat(e.target.value) || 0.15 })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                step="0.01"
                min="0"
                max="1"
              />
              <span className="text-slate-500 mt-1">Probability of random changes (0-1)</span>
            </label>
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={isLoading}
        className="w-full group rounded-xl border border-emerald-600/60 bg-emerald-600/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Optimising…
          </span>
        ) : (
          '⟳ Run Optimization'
        )}
      </button>
    </div>
  );
}
