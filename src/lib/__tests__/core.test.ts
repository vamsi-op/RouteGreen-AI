import { test } from "node:test";
import assert from "node:assert/strict";

import { packCargo } from "../packing";
import { segmentFuelLiters, fuelToCo2Kg } from "../emissions";
import { solveRoute } from "../routing";
import { runOptimization } from "../optimizer";
import {
  DEFAULT_CONTAINER,
  DEFAULT_FUEL_COEFFS,
  DEPOT_ID,
  SAMPLE_CARGO,
  SAMPLE_STOPS,
} from "../data";

test("3D packing places all sample items without overlap", () => {
  const result = packCargo(SAMPLE_CARGO, DEFAULT_CONTAINER);
  assert.equal(result.unplaced.length, 0, "all items should be placed");

  // No two placed boxes overlap in 3D space.
  const p = result.placements;
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const a = p[i];
      const b = p[j];
      const overlap =
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y &&
        a.z < b.z + b.d &&
        a.z + a.d > b.z;
      assert.ok(!overlap, `boxes ${a.item.id} and ${b.item.id} overlap`);
    }
  }
  assert.ok(result.volumeEfficiency > 0 && result.volumeEfficiency <= 100);
});

test("packing respects the weight limit", () => {
  const heavy = SAMPLE_CARGO.map((c) => ({ ...c, weight: 1000 }));
  const result = packCargo(heavy, DEFAULT_CONTAINER);
  assert.ok(result.totalWeight <= DEFAULT_CONTAINER.maxWeight);
});

test("fuel model: uphill costs more than flat, downhill is clamped", () => {
  const flat = segmentFuelLiters(10, 0, 1000, DEFAULT_FUEL_COEFFS);
  const uphill = segmentFuelLiters(10, 5, 1000, DEFAULT_FUEL_COEFFS);
  const downhill = segmentFuelLiters(10, -20, 1000, DEFAULT_FUEL_COEFFS);

  assert.ok(uphill > flat, "uphill should burn more than flat");
  // downhill clamped to idle floor * distance
  assert.ok(downhill >= DEFAULT_FUEL_COEFFS.idleFloor * 10 - 1e-9);
  assert.ok(downhill < flat, "downhill should burn less than flat");
});

test("heavier load burns more fuel on the same segment", () => {
  const light = segmentFuelLiters(10, 2, 0, DEFAULT_FUEL_COEFFS);
  const loaded = segmentFuelLiters(10, 2, 2000, DEFAULT_FUEL_COEFFS);
  assert.ok(loaded > light);
});

test("CO2 conversion is proportional to fuel", () => {
  assert.equal(fuelToCo2Kg(10), 26.8);
});

test("GA route is no worse than the distance-only baseline on fuel", () => {
  const { optimized, baseline } = solveRoute(
    SAMPLE_STOPS,
    DEPOT_ID,
    SAMPLE_CARGO,
    DEFAULT_FUEL_COEFFS
  );
  assert.ok(
    optimized.totalFuelLiters <= baseline.totalFuelLiters + 1e-6,
    "optimized fuel should not exceed baseline"
  );
  // Closed tour: starts and ends at depot.
  assert.equal(optimized.order[0], DEPOT_ID);
  assert.equal(optimized.order[optimized.order.length - 1], DEPOT_ID);
});

test("runOptimization returns a full comparison set", () => {
  const res = runOptimization();
  assert.equal(res.comparison.length, 4);
  const metrics = res.comparison.map((c) => c.metric);
  assert.ok(metrics.includes("Total Distance"));
  assert.ok(metrics.includes("Fuel Consumed"));
  assert.ok(metrics.includes("CO2 Emissions"));
  assert.ok(metrics.includes("Volume Utilization"));
});
