// Dashboard: run the optimization engine, render tables + ESG report.

import { runOptimization } from "./engine/optimizer.js";
import { generateReport } from "./engine/report.js";

let currentResult = null;
const listeners = [];

/** Allow other modules (the 3D simulator) to react to fresh results. */
export function onResult(cb) {
  listeners.push(cb);
  if (currentResult) cb(currentResult);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function renderMetrics(comparison) {
  const body = document.getElementById("metrics-body");
  body.innerHTML = comparison
    .map((r) => {
      const isUtil = r.metric === "Volume Utilization";
      const positive = r.improvementPct > 0;
      const barW = Math.min(Math.abs(r.improvementPct), 100);
      return `
        <tr>
          <th scope="row">
            ${escapeHtml(r.metric)}
            <div class="mini-bar ${positive ? "" : "neg"}"><i style="width:${barW}%"></i></div>
          </th>
          <td>${r.traditional}${r.unit}</td>
          <td class="up">${r.routeGreen}${r.unit}</td>
          <td class="${positive ? "up" : "down"}">${positive ? "▲" : "▼"} ${Math.abs(r.improvementPct)}${isUtil ? " pts" : "%"}</td>
        </tr>`;
    })
    .join("");
}

function renderSegments(route) {
  const body = document.getElementById("segment-body");
  body.innerHTML = route.segments
    .map((s) => {
      const up = s.slopePct >= 0;
      return `
        <tr>
          <th scope="row">${escapeHtml(s.fromId)} → ${escapeHtml(s.toId)}</th>
          <td>${s.distanceKm.toFixed(1)}</td>
          <td class="${up ? "down" : "up"}"><span class="slope-dot" style="background:${up ? "#fb7185" : "#34d399"}"></span>${up ? "+" : ""}${s.slopePct.toFixed(2)}</td>
          <td>${s.cargoWeightKg.toFixed(0)}</td>
          <td>${s.fuelLiters.toFixed(2)}</td>
          <td>${s.co2Kg.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  document.getElementById("segment-foot").innerHTML = `
    <tr>
      <td>Total</td>
      <td>${route.totalDistanceKm.toFixed(1)}</td>
      <td>—</td><td>—</td>
      <td>${route.totalFuelLiters.toFixed(2)}</td>
      <td>${route.totalCo2Kg.toFixed(2)}</td>
    </tr>`;
}

function renderReport(report) {
  const el = document.getElementById("report-body");
  const auditItems = report.audit
    .map((a) => {
      const pass = a.startsWith("PASS");
      return `<li class="${pass ? "pass" : "flag"}">${pass ? "✓" : "⚠"} ${escapeHtml(a)}</li>`;
    })
    .join("");
  el.innerHTML = `
    <span class="badge-src">Local deterministic agent · ${escapeHtml(report.modelId)}</span>
    <div class="sub-card">
      <h4>Eco-Auditor Findings</h4>
      <ul class="audit-list">${auditItems}</ul>
    </div>
    <div class="sub-card">
      <h4>Executive Reporting Agent</h4>
      <p class="report-text">${escapeHtml(report.text)}</p>
    </div>`;
}

function setStatus(html) {
  document.getElementById("dash-status").innerHTML = html;
}

async function run(seed) {
  const results = document.getElementById("dash-results");
  const rerunBtn = document.getElementById("rerun-btn");
  rerunBtn.disabled = true;
  setStatus(`<div class="card"><span class="spinner"></span> Running solvers…</div>`);

  // Yield a frame so the loading state paints before the (sync) GA runs.
  await new Promise((r) => setTimeout(r, 60));

  try {
    currentResult = runOptimization({ seed: seed ?? Math.floor(Math.random() * 1e6) });
    renderMetrics(currentResult.comparison);
    renderSegments(currentResult.optimized);
    document.getElementById("report-body").innerHTML =
      `<p class="note">Run the multi-agent network to audit the optimization and draft the ESG compliance statement.</p>`;
    results.hidden = false;
    setStatus("");
    listeners.forEach((cb) => cb(currentResult));
  } catch (err) {
    setStatus(`<div class="err-box">Optimization failed: ${escapeHtml(err.message || err)}</div>`);
  } finally {
    rerunBtn.disabled = false;
  }
}

export function initDashboard() {
  const rerunBtn = document.getElementById("rerun-btn");
  const agentsBtn = document.getElementById("agents-btn");

  rerunBtn.addEventListener("click", () => run());

  agentsBtn.addEventListener("click", async () => {
    if (!currentResult) return;
    agentsBtn.disabled = true;
    agentsBtn.textContent = "Generating…";
    try {
      const report = await generateReport(currentResult);
      renderReport(report);
    } catch (err) {
      document.getElementById("report-body").innerHTML =
        `<div class="err-box">Report generation failed: ${escapeHtml(err.message || err)}</div>`;
    } finally {
      agentsBtn.disabled = false;
      agentsBtn.textContent = "Run Agents";
    }
  });

  run(42);
}
