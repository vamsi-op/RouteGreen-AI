# RouteGreen AI — Static Production Site

A dependency-free (no build step) static website: plain **HTML + CSS + vanilla
JavaScript (ES modules)**, with **Three.js** for heavy animated 3D and **GSAP**
for scroll animation. The full Operations Research engine (3D bin packing +
Genetic Algorithm routing + fuel/CO₂ model) is ported to vanilla JS and runs
entirely in the browser — no server or API required.

## Run locally

ES modules must be served over HTTP (opening `index.html` via `file://` will not
work). Any static server does the job:

```bash
# from this folder
python -m http.server 8123
#   → http://localhost:8123
```

or

```bash
npx --yes serve .
```

Three.js and GSAP load from a CDN via an import map, so the first load needs a
network connection. If the CDN is unreachable, the page still renders and the
dashboard still works — only the 3D scenes and GSAP easing are skipped
(animations fall back to an IntersectionObserver).

## Structure

```
site/
  index.html            # all sections + import map + CDN tags
  css/styles.css         # theme, layout, animations, responsive, reduced-motion
  js/
    main.js              # entry: wires everything together
    navbar.js            # scrolled state, active section, mobile menu
    animations.js        # GSAP scroll reveals + counters (a11y fallback)
    dashboard.js         # runs the engine, renders tables + ESG report
    hero3d.js            # animated hero: truck, orbiting cargo, particles
    simulator3d.js       # interactive packing + route-drive simulator (OrbitControls)
    engine/              # OR engine (ported from the TypeScript app)
      data.js  geo.js  packing.js  emissions.js  routing.js  optimizer.js  report.js
```

## Deploy

It is fully static — drop the `site/` folder on any static host (GitHub Pages,
Netlify, Vercel, S3, Nginx). No build, no environment variables.

## Accessibility

- Skip link, semantic landmarks, labelled controls, and `aria-current` nav state.
- Full `prefers-reduced-motion` support: 3D scenes render a single static frame,
  counters jump to their final value, and transitions are disabled.
