import type { Stop } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle (haversine) distance between two stops in kilometres. */
export function haversineKm(a: Stop, b: Stop): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Average road slope grade (%) between two stops.
 * theta = (elev_j - elev_i) / (distance_m) * 100
 */
export function slopePct(a: Stop, b: Stop, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  const rise = b.elevation - a.elevation; // metres
  const run = distanceKm * 1000; // metres
  return (rise / run) * 100;
}

/** Build a symmetric distance matrix keyed by stop index. */
export function buildDistanceMatrix(stops: Stop[]): number[][] {
  const n = stops.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineKm(stops[i], stops[j]);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}
