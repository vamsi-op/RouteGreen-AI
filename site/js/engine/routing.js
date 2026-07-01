// Carbon-aware vehicle routing via a Genetic Algorithm + distance-only baseline.

import { segmentFuelLiters, fuelToCo2Kg } from "./emissions.js";
import { buildDistanceMatrix, slopePct } from "./geo.js";

export const DEFAULT_GA_OPTIONS = {
  populationSize: 120,
  generations: 200,
  eliteFraction: 0.3,
  mutationRate: 0.02,
  tournamentSize: 4,
  seed: 42,
};

/** Deterministic PRNG (mulberry32) so results are reproducible. */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildContext(stops, depotId, cargo, coeffs) {
  const depotIndex = stops.findIndex((s) => s.id === depotId);
  const dist = buildDistanceMatrix(stops);

  const weightByIndex = stops.map((s) =>
    cargo
      .filter((c) => c.destinationId === s.id)
      .reduce((sum, c) => sum + c.weight, 0)
  );
  const totalCargoKg = weightByIndex.reduce((a, b) => a + b, 0);
  const customerIndices = stops.map((_, i) => i).filter((i) => i !== depotIndex);

  return { stops, depotIndex, customerIndices, dist, weightByIndex, totalCargoKg, coeffs };
}

/** Evaluate a full closed tour (depot -> sequence -> depot) and produce segments. */
export function evaluateTour(ctx, sequence) {
  const order = [ctx.depotIndex, ...sequence, ctx.depotIndex];
  const segments = [];

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

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Order Crossover (OX). */
function orderCrossover(p1, p2, rng) {
  const n = p1.length;
  if (n < 2) return [...p1];
  const start = Math.floor(rng() * n);
  const end = start + Math.floor(rng() * (n - start));

  const child = new Array(n).fill(-1);
  const taken = new Set();
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

function swapMutate(seq, rate, rng) {
  const a = [...seq];
  for (let i = 0; i < a.length; i++) {
    if (rng() < rate) {
      const j = Math.floor(rng() * a.length);
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

function nearestNeighbourByDistance(ctx) {
  const remaining = new Set(ctx.customerIndices);
  const seq = [];
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

/**
 * Solve routing. Returns the GA-optimized tour plus a distance-only baseline.
 */
export function solveRoute(stops, depotId, cargo, coeffs, options = DEFAULT_GA_OPTIONS) {
  const ctx = buildContext(stops, depotId, cargo, coeffs);
  const rng = makeRng(options.seed);

  const baselineSeq = nearestNeighbourByDistance(ctx);
  const baseline = evaluateTour(ctx, baselineSeq);

  if (ctx.customerIndices.length <= 1) {
    return { optimized: evaluateTour(ctx, ctx.customerIndices), baseline };
  }

  const fitness = (seq) => 1 / (evaluateTour(ctx, seq).totalFuelLiters + 1e-9);

  let population = [];
  population.push([...baselineSeq]);
  while (population.length < options.populationSize) {
    population.push(shuffle(ctx.customerIndices, rng));
  }

  const eliteCount = Math.max(1, Math.floor(options.populationSize * options.eliteFraction));

  const tournament = (scored) => {
    let best = null;
    for (let t = 0; t < options.tournamentSize; t++) {
      const cand = scored[Math.floor(rng() * scored.length)];
      if (!best || cand.fit > best.fit) best = cand;
    }
    return best.seq;
  };

  for (let gen = 0; gen < options.generations; gen++) {
    const scored = population
      .map((seq) => ({ seq, fit: fitness(seq) }))
      .sort((a, b) => b.fit - a.fit);

    const next = scored.slice(0, eliteCount).map((s) => s.seq);

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
