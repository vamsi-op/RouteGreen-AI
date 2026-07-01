// Shifting-weight, slope-sensitive fuel + CO2 model.

import { DIESEL_CO2_PER_LITER } from "./data.js";

/**
 * Fuel = distance * [ cBase + cWeight*(tareTonnes+cargoTonnes) + cSlope*slopePct ]
 * Downhill reduces consumption but is clamped to idleFloor.
 */
export function segmentFuelLiters(distanceKm, slopePct, cargoWeightKg, coeffs) {
  const totalTonnes = (coeffs.tareWeight + cargoWeightKg) / 1000;
  const ratePerKm =
    coeffs.cBase + coeffs.cWeight * totalTonnes + coeffs.cSlope * slopePct;
  const clampedRate = Math.max(ratePerKm, coeffs.idleFloor);
  return clampedRate * distanceKm;
}

/** Convert litres of diesel burned to kg CO2e (GLEC factor). */
export function fuelToCo2Kg(liters) {
  return liters * DIESEL_CO2_PER_LITER;
}
