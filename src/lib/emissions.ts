import { DIESEL_CO2_PER_LITER } from "./data";
import type { FuelCoefficients } from "./types";

/**
 * Shifting-weight, slope-sensitive fuel consumption model (proposal section 7.2).
 *
 * Fuel = distance * [ cBase
 *                   + cWeight * (tareTonnes + cargoTonnes)
 *                   + cSlope  * slopePct ]
 *
 * Downhill (negative slope) reduces consumption but is clamped to idleFloor.
 */
export function segmentFuelLiters(
  distanceKm: number,
  slopePct: number,
  cargoWeightKg: number,
  coeffs: FuelCoefficients
): number {
  const totalTonnes = (coeffs.tareWeight + cargoWeightKg) / 1000;
  const ratePerKm =
    coeffs.cBase + coeffs.cWeight * totalTonnes + coeffs.cSlope * slopePct;
  const clampedRate = Math.max(ratePerKm, coeffs.idleFloor);
  return clampedRate * distanceKm;
}

/** Convert litres of diesel burned to kg CO2e (GLEC factor). */
export function fuelToCo2Kg(liters: number): number {
  return liters * DIESEL_CO2_PER_LITER;
}
