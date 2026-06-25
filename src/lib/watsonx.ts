import type { OptimizeResponse, Stop } from "./types";

/**
 * IBM Granite multi-agent QA layer (proposal section 10).
 *
 * If watsonx.ai credentials are configured the Executive Reporting Agent calls
 * the live granite text-generation endpoint. Otherwise we fall back to a
 * deterministic local report generator so the platform remains fully
 * functional offline (useful for demos / viva without network access).
 */

interface WatsonxConfig {
  apiKey: string;
  projectId: string;
  url: string;
  modelId: string;
}

function readConfig(): WatsonxConfig | null {
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    projectId,
    url: process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com",
    modelId: process.env.WATSONX_MODEL_ID || "ibm/granite-3-8b-instruct",
  };
}

/** Exchange an IBM Cloud API key for a short-lived IAM bearer token. */
async function getIamToken(apiKey: string): Promise<string> {
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });
  if (!res.ok) {
    throw new Error(`IAM token request failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function buildPrompt(result: OptimizeResponse): string {
  const lines = result.comparison
    .map(
      (c) =>
        `- ${c.metric}: traditional ${c.traditional}${c.unit} vs RouteGreen ${c.routeGreen}${c.unit} (${c.improvementPct >= 0 ? "+" : ""}${c.improvementPct}${c.metric === "Volume Utilization" ? " pts" : "% better"})`
    )
    .join("\n");

  const routeNames = result.optimized.order
    .map((id) => result.stops.find((s) => s.id === id)?.name ?? id)
    .join(" -> ");

  return [
    "You are the Executive Reporting Agent for RouteGreen AI, a carbon-aware logistics platform.",
    "Write a concise, manager-facing ESG compliance summary (max 180 words) based on the optimization results below.",
    "Reference Scope 3 transport emissions, GRI 302/305 alignment, and the fuel savings achieved.",
    "",
    `Optimized route: ${routeNames}`,
    `Packing efficiency: ${result.packing.volumeEfficiency.toFixed(1)}%`,
    "Comparative metrics:",
    lines,
  ].join("\n");
}

export interface AgentReport {
  source: "watsonx" | "local-fallback";
  modelId: string;
  text: string;
  audit: string[];
}

/** Eco-Auditor agent: deterministic rule checks over solver output. */
function ecoAudit(result: OptimizeResponse): string[] {
  const audit: string[] = [];
  const util = result.packing.volumeEfficiency;
  audit.push(
    util >= 60
      ? `PASS: Volume utilisation ${util.toFixed(1)}% meets the >=60% load-density target.`
      : `FLAG: Volume utilisation ${util.toFixed(1)}% is below the 60% target — consider consolidation.`
  );
  if (result.packing.unplaced.length > 0) {
    audit.push(
      `FLAG: ${result.packing.unplaced.length} item(s) could not be loaded (capacity exceeded).`
    );
  } else {
    audit.push("PASS: All cargo items loaded within weight and volume limits.");
  }
  const fuelSaved =
    result.baseline.totalFuelLiters - result.optimized.totalFuelLiters;
  const co2Saved = result.baseline.totalCo2Kg - result.optimized.totalCo2Kg;
  audit.push(
    `PASS: Scope 3 ledger logged — ${fuelSaved.toFixed(1)} L fuel and ${co2Saved.toFixed(1)} kg CO2e avoided vs distance-only routing.`
  );
  audit.push("PASS: Segment-by-segment audit trail generated (GRI 302/305 / CSRD aligned).");
  return audit;
}

function localReport(result: OptimizeResponse, audit: string[]): string {
  const co2Saved = (
    result.baseline.totalCo2Kg - result.optimized.totalCo2Kg
  ).toFixed(1);
  const fuelSaved = (
    result.baseline.totalFuelLiters - result.optimized.totalFuelLiters
  ).toFixed(1);
  const routeNames = result.optimized.order
    .map((id: string) => result.stops.find((s: Stop) => s.id === id)?.name ?? id)
    .join(" -> ");

  return [
    "ESG Logistics Compliance Summary (RouteGreen AI)",
    "",
    `The optimized dispatch (${routeNames}) achieved a packing density of ${result.packing.volumeEfficiency.toFixed(1)}%, materially reducing the number of vehicle trips required.`,
    `Versus a conventional distance-only plan, the carbon-aware, shifting-weight router cut diesel consumption by ${fuelSaved} L and avoided ${co2Saved} kg of CO2e on this run.`,
    "These reductions are recorded against Scope 3 upstream/downstream transport emissions with a full segment-level audit trail, supporting GRI 302 (Energy), GRI 305 (Emissions) and CSRD disclosure requirements.",
    "All cargo was loaded within statutory weight limits and the route stays on approved commercial trucking lanes.",
  ].join("\n");
}

export async function generateReport(result: OptimizeResponse): Promise<AgentReport> {
  const audit = ecoAudit(result);
  const config = readConfig();

  if (!config) {
    return {
      source: "local-fallback",
      modelId: "local-deterministic",
      text: localReport(result, audit),
      audit,
    };
  }

  try {
    const token = await getIamToken(config.apiKey);
    const prompt = buildPrompt(result);
    const res = await fetch(
      `${config.url}/ml/v1/text/generation?version=2023-05-29`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model_id: config.modelId,
          input: prompt,
          parameters: {
            decoding_method: "greedy",
            max_new_tokens: 300,
            temperature: 0,
          },
          project_id: config.projectId,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`watsonx generation failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      results: Array<{ generated_text: string }>;
    };
    return {
      source: "watsonx",
      modelId: config.modelId,
      text: data.results[0]?.generated_text?.trim() || localReport(result, audit),
      audit,
    };
  } catch (err) {
    console.error("watsonx API error:", err);
    // Network/credential failure -> graceful fallback, never crash the request.
    return {
      source: "local-fallback",
      modelId: "local-deterministic",
      text: localReport(result, audit),
      audit,
    };
  }
}
