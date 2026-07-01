/**
 * Central site configuration.
 *
 * Values are read from public env vars where it makes sense so the app can be
 * promoted across environments (preview / production) without code changes.
 * All values have safe production defaults.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://routegreen.ai";

export const siteConfig = {
  name: "RouteGreen AI",
  shortName: "RouteGreen",
  url: trimTrailingSlash(rawSiteUrl),
  title:
    "RouteGreen AI — Carbon-Aware Fleet Routing & 3D Cargo Optimization",
  description:
    "Hybrid AI + Operations Research platform for carbon-aware fleet routing and 3D cargo load optimization. Aligned with UN SDG 11, 12, and 13. Built with IBM Granite on watsonx.ai.",
  keywords: [
    "carbon-aware routing",
    "3D bin packing",
    "IBM Granite",
    "sustainability",
    "ESG compliance",
    "fleet optimization",
    "SDG",
    "watsonx.ai",
  ],
  themeColor: "#020617",
  githubUrl: "https://github.com/vamsi-op/RouteGreen-AI.git",
  ogImage: "/eco-badge.svg",
} as const;

export interface NavLink {
  label: string;
  /** In-page anchor id (without the leading #). */
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Problem", href: "problem" },
  { label: "How It Works", href: "how-it-works" },
  { label: "SDGs", href: "sdg" },
  { label: "Dashboard", href: "dashboard" },
  { label: "3D Simulator", href: "simulator" },
  { label: "Impact", href: "impact" },
  { label: "Responsible AI", href: "responsible-ai" },
] as const;

export const techStack = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "IBM Granite",
  "watsonx.ai",
  "3D-BPP",
  "Genetic Algorithm VRP",
  "Tailwind CSS",
] as const;
