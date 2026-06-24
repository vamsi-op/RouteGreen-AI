import { segmentFuelLiters, fuelToCo2Kg } from "./emissions";
import { buildDistanceMatrix, slopePct } from "./geo";
import type {
  CargoItem,
  FuelCoefficients,
  RouteResult,
  RouteSegment,
  Stop,
} from "./types";

/**
 * Carbon-aware vehicle routing via a Genetic Algorithm (proposal section 7.3).
 *
 * Chromosome : permutation of the non-depot stops.
 * Fitness    : inverse of total fuel cost of the closed tour (depot -> ... -> depot).
 * Selection  : tournament selection, top elites preserved.
 * Crossover  : Order Crossover (OX).
 * Mutation   : random swap.
 *
 * The fuel cost is load-dependent: the cargo destined for each stop is dropped
 * on arrival, so the truck gets lighter along the tour. The order in which we
 * deliver therefore changes the total fuel burned.
 */

export interface GAOptions {
  populationSize: number;
  generations: number;
  eliteFraction: number;
  mutationRate: number;
  tournamentSize: number;
  seed: number;
}

export const DEFAULT_GA_OPTIONS: GAOptions = {
  populationSize: 120,
  generations: 200,
  eliteFraction: 0.3,
  mutationRate: 0.02,
  tournamentSize: 4,
  seed: 42,
};

/** Deterministic PRNG (mulberry32) so results are reproducible. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RouteContext {
  stops: Stop[];
  depotIndex: number;
  customerIndices: number[];
  dist: number[][];
  weightByIndex: number[];
  totalCargoKg: number;
  coeffs: FuelCoefficients;
}

function buildContext(
  stops: Stop[],
  depotId: string,
  cargo: CargoItem[],
  coeffs: FuelCoefficients
): RouteContext {
  const depotIndex = stops.findIndex((s) => s.id === depotId);
  const dist = buildDistanceMatrix(stops);

  const weightByIndex = stops.map((s) =>
    cargo
      .filter((c) => c.destinationId === s.id)
      .reduce((sum, c) => sum + c.weight, 0)
  );
  const totalCargoKg = weightByIndex.reduce((a, b) => a + b, 0);

  const customerIndices = stops
    .map((_, i) => i)
    .filter((i) => i !== depotIndex);

  return {
    stops,
    depotIndex,
    customerIndices,
    dist,
    weightByIndex,
    totalCargoKg,
    coeffs,
  };
}

/** Evaluate a full closed tour (depot -> sequence -> depot) and produce segments. */
export function evaluateTour(ctx: RouteContext, sequence: number[]): RouteResult {
  const order = [ctx.depotIndex, ...sequence, ctx.depotIndex];
  const segments: RouteSegment[] = [];

  let remainingCargo = ctx.totalCargoKg;
  let totalDistanceKm = 0;
  let totalFuelLiters = 0;
  let totalCo2Kg = 0;

  for (let k = 0; k < order.length - 1; k++) {
    const i = order[k];
    const j = order[k + 1];
    const from = ctx.stops[i];
    const to = ctx.stops[j];
    const distanceKm = ctx.dist[i][j];
    const grade = slopePct(from, to, distanceKm);

    const fuel = segmentFuelLiters(distanceKm, grade, remainingCargo, ctx.coeffs);
    const co2 = fuelToCo2Kg(fuel);

    segments.push({
      fromId: from.id,
      toId: to.id,
      distanceKm,
      slopePct: grade,
      cargoWeightKg: remainingCargo,
      fuelLiters: fuel,
      co2Kg: co2,
    });

    totalDistanceKm += distanceKm;
    totalFuelLiters += fuel;
    totalCo2Kg += co2;

    // Drop the cargo destined for the arrival stop.
    remainingCargo -= ctx.weightByIndex[j];
    if (remainingCargo < 0) remainingCargo = 0;
  }

  return {
    order: order.map((i) => ctx.stops[i].id),
    segments,
    totalDistanceKm,
    totalFuelLiters,
    totalCo2Kg,
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Order Crossover (OX). */
function orderCrossover(p1: number[], p2: number[], rng: () => number): number[] {
  const n = p1.length;
  if (n < 2) return [...p1];
  const start = Math.floor(rng() * n);
  const end = start + Math.floor(rng() * (n - start));

  const child = new Array<number>(n).fill(-1);
  const taken = new Set<number>();
  for (let i = start; i <= end; i++) {
    child[i] = p1[i];
    taken.add(p1[i]);
  }
  let cursor = (end + 1) % n;
  for (let k = 0; k < n; k++) {
    const gene = p2[(end + 1 + k) % n];
    if (!taken.has(gene)) {
      child[cursor] = gene;
      cursor = (cursor + 1) % n;
    }
  }
  return child;
}

function swapMutate(seq: number[], rate: number, rng: () => number): number[] {
  const a = [...seq];
  for (let i = 0; i < a.length; i++) {
    if (rng() < rate) {
      const j = Math.floor(rng() * a.length);
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

export interface RoutingOutput {
  optimized: RouteResult;
  baseline: RouteResult;
}

/**
 * Solve routing. Returns the GA-optimized tour plus a "traditional"
 * distance-only baseline (nearest-neighbour by distance) for comparison.
 */
export function solveRoute(
  stops: Stop[],
  depotId: string,
  cargo: CargoItem[],
  coeffs: FuelCoefficients,
  options: GAOptions = DEFAULT_GA_OPTIONS
): RoutingOutput {
  const ctx = buildContext(stops, depotId, cargo, coeffs);
  const rng = makeRng(options.seed);

  // --- Baseline: distance-only nearest neighbour from depot ---
  const baselineSeq = nearestNeighbourByDistance(ctx);
  const baseline = evaluateTour(ctx, baselineSeq);

  // Trivial case: 0 or 1 customer => GA has nothing to optimise.
  if (ctx.customerIndices.length <= 1) {
    return { optimized: evaluateTour(ctx, ctx.customerIndices), baseline };
  }

  // --- GA over fuel cost ---
  const fitness = (seq: number[]) => 1 / (evaluateTour(ctx, seq).totalFuelLiters + 1e-9);

  let population: number[][] = [];
  // Seed population with the baseline plus random permutations.
  population.push([...baselineSeq]);
  while (population.length < options.populationSize) {
    population.push(shuffle(ctx.customerIndices, rng));
  }

  const eliteCount = Math.max(1, Math.floor(options.populationSize * options.eliteFraction));

  const tournament = (scored: Array<{ seq: number[]; fit: number }>): number[] => {
    let best: { seq: number[]; fit: number } | null = null;
    for (let t = 0; t < options.tournamentSize; t++) {
      const cand = scored[Math.floor(rng() * scored.length)];
      if (!best || cand.fit > best.fit) best = cand;
    }
    return best!.seq;
  };

  for (let gen = 0; gen < options.generations; gen++) {
    const scored = population
      .map((seq) => ({ seq, fit: fitness(seq) }))
      .sort((a, b) => b.fit - a.fit);

    const next: number[][] = scored.slice(0, eliteCount).map((s) => s.seq);

    while (next.length < options.populationSize) {
      const parentA = tournament(scored);
      const parentB = tournament(scored);
      let child = orderCrossover(parentA, parentB, rng);
      child = swapMutate(child, options.mutationRate, rng);
      next.push(child);
    }
    population = next;
  }

  const finalBest = population
    .map((seq) => ({ seq, fit: fitness(seq) }))
    .sort((a, b) => b.fit - a.fit)[0].seq;

  return { optimized: evaluateTour(ctx, finalBest), baseline };
}

/** Greedy nearest-neighbour ordering using pure distance (the "traditional" router). */
function nearestNeighbourByDistance(ctx: RouteContext): number[] {
  const remaining = new Set(ctx.customerIndices);
  const seq: number[] = [];
  let current = ctx.depotIndex;
  while (remaining.size > 0) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (const idx of remaining) {
      const d = ctx.dist[current][idx];
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    }
    seq.push(bestIdx);
    remaining.delete(bestIdx);
    current = bestIdx;
  }
  return seq;
}
