import type { CargoItem, Container, FuelCoefficients, Stop } from "./types";

/**
 * Sample dataset — North-East India hilly corridor.
 * Elevations are real approximate altitudes (SRTM-derived) used as the
 * prototype fallback described in proposal section 8.
 *
 * The depot (Guwahati) sits low; the delivery stops climb into the Meghalaya
 * hills. Heavy cargo is intentionally destined for far / high stops so that a
 * distance-only router (which ignores load) produces a sub-optimal fuel order,
 * letting the carbon-aware Genetic Algorithm demonstrate a genuine saving.
 */
export const SAMPLE_STOPS: Stop[] = [
  { id: "GHY", name: "Guwahati (Depot)", lat: 26.1445, lng: 91.7362, elevation: 55 },
  { id: "NGP", name: "Nongpoh", lat: 26.04, lng: 91.86, elevation: 600 },
  { id: "BYR", name: "Byrnihat", lat: 26.02, lng: 91.88, elevation: 120 },
  { id: "UMI", name: "Umiam", lat: 25.92, lng: 91.89, elevation: 980 },
  { id: "BAR", name: "Barapani Valley", lat: 25.9, lng: 91.9, elevation: 300 },
  { id: "SHL", name: "Shillong", lat: 25.78, lng: 91.8933, elevation: 1496 },
  { id: "MAW", name: "Mawphlang", lat: 25.74, lng: 91.74, elevation: 1700 },
  { id: "CHE", name: "Cherrapunji", lat: 25.6, lng: 91.7, elevation: 1430 },
];

/** Depot is always the first stop in the dataset. */
export const DEPOT_ID = SAMPLE_STOPS[0].id;

/**
 * 2.5-ton diesel truck cargo bay (realistic light-commercial dimensions).
 * 2.0m W x 2.0m H x 4.0m D = 16.0 m^3 usable volume.
 */
export const DEFAULT_CONTAINER: Container = {
  W: 2.0,
  H: 2.0,
  D: 4.0,
  maxWeight: 3000,
};

export const DEFAULT_FUEL_COEFFS: FuelCoefficients = {
  cBase: 0.15,
  cWeight: 0.02, // per tonne
  cSlope: 0.05, // per % grade
  idleFloor: 0.08,
  tareWeight: 2500,
};

/**
 * 13 modular 1m x 1m x 1m units (tile cleanly into the 2x2x4 = 16-cell bay,
 * giving an honest ~81% volume fill). Total payload ~2,210 kg.
 * Heavy units are routed to the far/high stops (SHL, CHE, JOW).
 */
export const SAMPLE_CARGO: CargoItem[] = [
  { id: "P01", label: "Machinery A", w: 1, h: 1, d: 1, weight: 240, destinationId: "CHE" },
  { id: "P02", label: "Machinery B", w: 1, h: 1, d: 1, weight: 230, destinationId: "SHL" },
  { id: "P03", label: "Beverage cases", w: 1, h: 1, d: 1, weight: 220, destinationId: "MAW" },
  { id: "P04", label: "Tiles pallet", w: 1, h: 1, d: 1, weight: 210, destinationId: "CHE" },
  { id: "P05", label: "Cement bags", w: 1, h: 1, d: 1, weight: 200, destinationId: "SHL" },
  { id: "P06", label: "Retail pallet", w: 1, h: 1, d: 1, weight: 180, destinationId: "MAW" },
  { id: "P07", label: "Appliances", w: 1, h: 1, d: 1, weight: 170, destinationId: "UMI" },
  { id: "P08", label: "Furniture", w: 1, h: 1, d: 1, weight: 160, destinationId: "BAR" },
  { id: "P09", label: "Textile bales", w: 1, h: 1, d: 1, weight: 150, destinationId: "BYR" },
  { id: "P10", label: "Electronics", w: 1, h: 1, d: 1, weight: 130, destinationId: "NGP" },
  { id: "P11", label: "Stationery", w: 1, h: 1, d: 1, weight: 110, destinationId: "BYR" },
  { id: "P12", label: "Packaged food", w: 1, h: 1, d: 1, weight: 110, destinationId: "BAR" },
  { id: "P13", label: "Apparel", w: 1, h: 1, d: 1, weight: 100, destinationId: "NGP" },
];

/** GLEC-aligned emission factor for diesel: kg CO2e per litre burned. */
export const DIESEL_CO2_PER_LITER = 2.68;
