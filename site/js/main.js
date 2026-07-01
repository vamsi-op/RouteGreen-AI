// Entry point: boot navbar, animations, dashboard engine, and 3D scenes.

import { initNavbar } from "./navbar.js";
import { initAnimations } from "./animations.js";
import { initDashboard, onResult } from "./dashboard.js";

function boot() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Core UI + engine use only local modules — these always run.
  initNavbar();
  initAnimations();
  initDashboard();

  // Heavy 3D is loaded lazily and in isolation: it depends on the Three.js CDN,
  // so a network/WebGL failure here must never take down the rest of the page.
  initThree();
}

function initThree() {
  // Hero and simulator are initialized independently so a failure in one
  // (or a CDN hiccup) never prevents the other from rendering.
  import("./hero3d.js")
    .then((m) => m.initHero())
    .catch((err) => console.error("Hero 3D failed:", err));

  import("./simulator3d.js")
    .then((m) => {
      const simulator = m.createSimulator();
      if (simulator) {
        onResult((result) => simulator.setData(result));
        wireSimControls(simulator);
      }
    })
    .catch((err) => {
      console.error("Simulator 3D failed:", err);
      const stage = document.querySelector(".sim-stage");
      if (stage) {
        stage.innerHTML =
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;text-align:center;padding:24px;">3D simulator unavailable — the Three.js CDN could not be reached. The dashboard results above are fully functional.</div>';
      }
    });
}

function wireSimControls(sim) {
  const modePacking = document.getElementById("mode-packing");
  const modeRouting = document.getElementById("mode-routing");
  const playBtn = document.getElementById("sim-play");
  const restartBtn = document.getElementById("sim-restart");
  const speedBtn = document.getElementById("sim-speed");

  const setModeUI = (activeEl, otherEl, mode) => {
    activeEl.classList.add("active");
    activeEl.setAttribute("aria-selected", "true");
    otherEl.classList.remove("active");
    otherEl.setAttribute("aria-selected", "false");
    sim.setMode(mode);
  };
  modePacking.addEventListener("click", () => setModeUI(modePacking, modeRouting, "packing"));
  modeRouting.addEventListener("click", () => setModeUI(modeRouting, modePacking, "routing"));

  playBtn.addEventListener("click", () => {
    const playing = sim.toggle();
    playBtn.textContent = playing ? "⏸ Pause" : "▶ Play";
  });

  restartBtn.addEventListener("click", () => sim.restart());

  const speeds = [1, 2, 4];
  let si = 0;
  speedBtn.addEventListener("click", () => {
    si = (si + 1) % speeds.length;
    sim.setSpeed(speeds[si]);
    speedBtn.textContent = `${speeds[si]}×`;
  });

  // Sync play button label with the simulator's initial state (paused when the
  // user prefers reduced motion).
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    playBtn.textContent = "▶ Play";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
