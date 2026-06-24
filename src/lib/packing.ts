import type { CargoItem, Container, PackingResult, Placement } from "./types";

/**
 * 3D Bin Packing heuristic (3D-BPP).
 *
 * Strategy: a deterministic "Extreme Point" style first-fit-decreasing packer.
 * Items are sorted by volume (largest first). For each item we maintain a set
 * of candidate anchor points (extreme points). The item is placed at the first
 * anchor where it fits without overlap, inside the container, and within the
 * remaining weight budget. After placement, new anchors are generated at the
 * far corners of the placed box.
 *
 * The packer tries the 6 axis-aligned orientations of each box and keeps the
 * one that yields the lowest placement (gravity-friendly, low centre of mass).
 */

interface AABB {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

function overlaps(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y &&
    a.z < b.z + b.d &&
    a.z + a.d > b.z
  );
}

function orientations(item: CargoItem): Array<[number, number, number]> {
  const { w, h, d } = item;
  return [
    [w, h, d],
    [w, d, h],
    [h, w, d],
    [h, d, w],
    [d, w, h],
    [d, h, w],
  ];
}

const EPS = 1e-6;

export function packCargo(items: CargoItem[], container: Container): PackingResult {
  const sorted = [...items].sort(
    (a, b) => b.w * b.h * b.d - a.w * a.h * a.d
  );

  const placements: Placement[] = [];
  const placedBoxes: AABB[] = [];
  const unplaced: CargoItem[] = [];
  let totalWeight = 0;

  // Candidate anchor points (extreme points). Start at the origin corner.
  let anchors: Array<{ x: number; y: number; z: number }> = [
    { x: 0, y: 0, z: 0 },
  ];

  for (const item of sorted) {
    if (totalWeight + item.weight > container.maxWeight) {
      unplaced.push(item);
      continue;
    }

    let best: { box: AABB; anchorIndex: number } | null = null;

    // Sort anchors bottom-up then front-left to prefer stable low placements.
    const sortedAnchors = anchors
      .map((a, idx) => ({ a, idx }))
      .sort((p, q) => p.a.y - q.a.y || p.a.z - q.a.z || p.a.x - q.a.x);

    for (const { a: anchor, idx } of sortedAnchors) {
      for (const [ow, oh, od] of orientations(item)) {
        const box: AABB = {
          x: anchor.x,
          y: anchor.y,
          z: anchor.z,
          w: ow,
          h: oh,
          d: od,
        };

        // Inside container?
        if (
          box.x + box.w > container.W + EPS ||
          box.y + box.h > container.H + EPS ||
          box.z + box.d > container.D + EPS
        ) {
          continue;
        }

        // Collision with already placed boxes?
        const collides = placedBoxes.some((pb) => overlaps(box, pb));
        if (collides) continue;

        if (best === null || box.y < best.box.y - EPS) {
          best = { box, anchorIndex: idx };
        }
        // First valid orientation at this anchor is enough to evaluate height.
        break;
      }
    }

    if (!best) {
      unplaced.push(item);
      continue;
    }

    const { box } = best;
    placedBoxes.push(box);
    placements.push({
      item,
      x: box.x,
      y: box.y,
      z: box.z,
      w: box.w,
      h: box.h,
      d: box.d,
    });
    totalWeight += item.weight;

    // Remove the consumed anchor and generate new extreme points.
    anchors.splice(best.anchorIndex, 1);
    anchors.push({ x: box.x + box.w, y: box.y, z: box.z });
    anchors.push({ x: box.x, y: box.y + box.h, z: box.z });
    anchors.push({ x: box.x, y: box.y, z: box.z + box.d });

    // De-duplicate anchors.
    const seen = new Set<string>();
    anchors = anchors.filter((p) => {
      const key = `${p.x.toFixed(3)}|${p.y.toFixed(3)}|${p.z.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const containerVolume = container.W * container.H * container.D;
  const usedVolume = placements.reduce((s, p) => s + p.w * p.h * p.d, 0);
  const volumeEfficiency = (usedVolume / containerVolume) * 100;

  return {
    placements,
    unplaced,
    volumeEfficiency,
    usedVolume,
    containerVolume,
    totalWeight,
  };
}
