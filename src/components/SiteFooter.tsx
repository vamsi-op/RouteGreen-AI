import { techStack } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-xl font-bold text-white">
            RouteGreen<span className="text-emerald-400"> AI</span>
          </h2>

          <p className="max-w-lg text-sm text-slate-400">
            Built for the{" "}
            <span className="font-medium text-slate-300">
              1M1B × IBM SkillsBuild × AICTE
            </span>{" "}
            AI for Sustainability Virtual Internship.
          </p>

          <ul className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1 text-xs text-slate-400"
              >
                {tech}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <span className="sdg-badge sdg-11">SDG 11</span>
            <span className="sdg-badge sdg-12">SDG 12</span>
            <span className="sdg-badge sdg-13">SDG 13</span>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} RouteGreen AI. Carbon-Aware Fleet
            Routing &amp; 3D Cargo Optimization.
          </p>
        </div>
      </div>
    </footer>
  );
}
