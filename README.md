# RouteGreen AI

![eco-score](eco-badge.svg)

Carbon-Aware Fleet Routing & 3D Cargo Load Optimization Platform — a hybrid AI + Operations Research system that solves 3D cargo packing and slope-aware, load-dependent vehicle routing concurrently, with an IBM Granite multi-agent QA layer producing audit-ready ESG reports.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS** dashboard with Canvas (3D packing) + SVG (route map) visualizations
- **Operations Research engines (TypeScript)**:
  - 3D Bin Packing heuristic (extreme-point first-fit-decreasing)
  - Genetic Algorithm VRP minimizing a shifting-weight, slope-sensitive fuel model
- **IBM Granite via watsonx.ai** for the Executive Reporting Agent, with a deterministic local fallback when no credentials are set

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dashboard auto-runs the optimization on the bundled North-East India sample dataset.

## Tests

```bash
npm test
```

Covers the packing solver (no overlap, weight limits), the fuel model (uphill > flat > downhill, load sensitivity), the GA router (never worse than baseline), and the orchestration output.

## IBM watsonx.ai (optional)

Copy `.env.example` to `.env` and fill in:

```
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-3-8b-instruct
```

Without these, the "Run Agents" button uses a local deterministic report generator so the app stays fully functional offline.

## Project structure

```
src/
  app/
    layout.tsx, page.tsx, globals.css
    api/optimize/route.ts   # runs packing + routing, returns metrics
    api/report/route.ts     # runs Granite multi-agent QA report
  components/
    Dashboard.tsx, MetricsPanel.tsx, PackingView.tsx,
    RouteMap.tsx, SegmentTable.tsx, ReportPanel.tsx
  lib/
    types.ts, data.ts, geo.ts
    packing.ts              # 3D-BPP solver
    emissions.ts            # fuel + CO2 model
    routing.ts              # Genetic Algorithm VRP
    optimizer.ts            # orchestration + comparison
    watsonx.ts              # IBM Granite agents (+ fallback)
    __tests__/core.test.ts
```

## How the fuel model works

```
Fuel(i→j) = distance × [ cBase + cWeight × (tareTonnes + cargoTonnes) + cSlope × slopePct ]
```

Cargo is dropped at each stop, so the truck gets lighter along the tour — meaning the *order* of deliveries changes total fuel burned. The GA searches delivery permutations to minimize this, while a distance-only nearest-neighbour serves as the "traditional" baseline for comparison.

## Sustainability (eco-lint)

This project is linted for environmental impact with [eco-lint](https://github.com/vamsi-op/eco-lint), which scans `package.json` / CI / Docker configs for energy-wasteful patterns and estimates CO₂ savings.

Current grade: **A (98/100)**. Applied optimizations:

- Added an `engines` field pinning a modern LTS runtime (`node: >=20.0.0`) so the app runs on an efficient, well-optimized Node version.
- Ran `npm dedupe` to flatten the dependency tree, shrinking `node_modules` and install/build time.

Config lives in `.eco-lintrc.json`. To re-scan:

```bash
npx github:vamsi-op/eco-lint .        # or clone + build, then: node dist/cli.js .
```
