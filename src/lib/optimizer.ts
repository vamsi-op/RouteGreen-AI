import {
  DEFAULT_CONTAINER,
  DEFAULT_FUEL_COEFFS,
  DEPOT_ID,
  SAMPLE_CARGO,
  SAMPLE_STOPS,
} from "./data";
import { packCargo } from "./packing";
import { solveRoute } from "./routing";
import type {
  CargoItem,
  ComparisonRow,
  Container,
  FuelCoefficients,
  OptimizeResponse,
  Stop,
} from "./types";

export interface OptimizeInput {
  stops?: Stop[];
  depotId?: string;
  cargo?: CargoItem[];
  container?: Container;
  coeffs?: FuelCoefficients;
  /** manual-loading volume utilisation assumed for the traditional baseline (0-100) */
  manualUtilizationPct?: number;
}

function pct(traditional: number, improved: number): number {
  if (traditional === 0) return 0;
  return ((traditional - improved) / traditional) * 100;
}

export function runOptimization(input: OptimizeInput = {}): OptimizeResponse {
  const stops = input.stops ?? SAMPLE_STOPS;
  const depotId = input.depotId ?? DEPOT_ID;
  const cargo = input.cargo ?? SAMPLE_CARGO;
  const container = input.container ?? DEFAULT_CONTAINER;
  const coeffs = input.coeffs ?? DEFAULT_FUEL_COEFFS;
  const manualUtil = input.manualUtilizationPct ?? 45;

  const packing = packCargo(cargo, container);
  const { optimized, baseline } = solveRoute(stops, depotId, cargo, coeffs);

  const comparison: ComparisonRow[] = [
    {
      metric: "Total Distance",
      traditional: round(baseline.totalDistanceKm),
      routeGreen: round(optimized.totalDistanceKm),
      unit: "km",
      improvementPct: round(pct(baseline.totalDistanceKm, optimized.totalDistanceKm)),
    },
    {
      metric: "Volume Utilization",
      traditional: manualUtil,
      routeGreen: round(packing.volumeEfficiency),
      unit: "%",
      // higher is better here, so improvement is the absolute gain
      improvementPct: round(packing.volumeEfficiency - manualUtil),
    },
    {
      metric: "Fuel Consumed",
      traditional: round(baseline.totalFuelLiters),
      routeGreen: round(optimized.totalFuelLiters),
      unit: "L",
      improvementPct: round(pct(baseline.totalFuelLiters, optimized.totalFuelLiters)),
    },
    {
      metric: "CO2 Emissions",
      traditional: round(baseline.totalCo2Kg),
      routeGreen: round(optimized.totalCo2Kg),
      unit: "kg",
      improvementPct: round(pct(baseline.totalCo2Kg, optimized.totalCo2Kg)),
    },
  ];

  return { packing, optimized, baseline, comparison, stops };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
