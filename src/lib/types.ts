// Core domain types for RouteGreen AI

/** A delivery package / cargo item with dimensions in metres and weight in kg. */
export interface CargoItem {
  id: string;
  label: string;
  /** width (m) */
  w: number;
  /** height (m) */
  h: number;
  /** depth (m) */
  d: number;
  /** weight (kg) */
  weight: number;
  /** id of the delivery stop this item is dropped at */
  destinationId: string;
}

/** Shipping container / truck cargo bay definition. */
export interface Container {
  /** width (m) */
  W: number;
  /** height (m) */
  H: number;
  /** depth (m) */
  D: number;
  /** maximum payload (kg) */
  maxWeight: number;
}

/** Result of placing a single item inside the container. */
export interface Placement {
  item: CargoItem;
  /** lower-front-left corner coordinates (m) */
  x: number;
  y: number;
  z: number;
  /** placed dimensions after any rotation (m) */
  w: number;
  h: number;
  d: number;
}

export interface PackingResult {
  placements: Placement[];
  unplaced: CargoItem[];
  /** percentage 0-100 */
  volumeEfficiency: number;
  usedVolume: number;
  containerVolume: number;
  totalWeight: number;
}

/** A delivery stop / node. */
export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** elevation in metres above sea level */
  elevation: number;
}

/** Physical fuel-consumption coefficients (configurable, see proposal section 8). */
export interface FuelCoefficients {
  /** baseline L/km for an empty truck on flat road */
  cBase: number;
  /** marginal L/km per tonne of cargo */
  cWeight: number;
  /** marginal L/km per % positive slope grade */
  cSlope: number;
  /** floor consumption rate (L/km) for steep downhill segments */
  idleFloor: number;
  /** tare (curb) weight of the vehicle in kg */
  tareWeight: number;
}

export interface RouteSegment {
  fromId: string;
  toId: string;
  distanceKm: number;
  /** slope grade in % (positive = uphill) */
  slopePct: number;
  /** remaining cargo weight (kg) carried over this segment */
  cargoWeightKg: number;
  fuelLiters: number;
  co2Kg: number;
}

export interface RouteResult {
  /** ordered list of stop ids, starting and ending at the depot */
  order: string[];
  segments: RouteSegment[];
  totalDistanceKm: number;
  totalFuelLiters: number;
  totalCo2Kg: number;
}

export interface ComparisonRow {
  metric: string;
  traditional: number;
  routeGreen: number;
  unit: string;
  /** relative improvement (%) */
  improvementPct: number;
}

export interface OptimizeResponse {
  packing: PackingResult;
  optimized: RouteResult;
  baseline: RouteResult;
  comparison: ComparisonRow[];
  stops: Stop[];
}
