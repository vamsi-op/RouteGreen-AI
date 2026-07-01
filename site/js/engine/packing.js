// 3D Bin Packing heuristic (Extreme-Point First-Fit-Decreasing).

function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y &&
    a.z < b.z + b.d &&
    a.z + a.d > b.z
  );
}

function orientations(item) {
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

export function packCargo(items, container) {
  const sorted = [...items].sort((a, b) => b.w * b.h * b.d - a.w * a.h * a.d);

  const placements = [];
  const placedBoxes = [];
  const unplaced = [];
  let totalWeight = 0;

  let anchors = [{ x: 0, y: 0, z: 0 }];

  for (const item of sorted) {
    if (totalWeight + item.weight > container.maxWeight) {
      unplaced.push(item);
      continue;
    }

    let best = null;

    const sortedAnchors = anchors
      .map((a, idx) => ({ a, idx }))
      .sort((p, q) => p.a.y - q.a.y || p.a.z - q.a.z || p.a.x - q.a.x);

    for (const { a: anchor, idx } of sortedAnchors) {
      for (const [ow, oh, od] of orientations(item)) {
        const box = { x: anchor.x, y: anchor.y, z: anchor.z, w: ow, h: oh, d: od };

        if (
          box.x + box.w > container.W + EPS ||
          box.y + box.h > container.H + EPS ||
          box.z + box.d > container.D + EPS
        ) {
          continue;
        }

        const collides = placedBoxes.some((pb) => overlaps(box, pb));
        if (collides) continue;

        if (best === null || box.y < best.box.y - EPS) {
          best = { box, anchorIndex: idx };
        }
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

    anchors.splice(best.anchorIndex, 1);
    anchors.push({ x: box.x + box.w, y: box.y, z: box.z });
    anchors.push({ x: box.x, y: box.y + box.h, z: box.z });
    anchors.push({ x: box.x, y: box.y, z: box.z + box.d });

    const seen = new Set();
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
