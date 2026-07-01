interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** When true, centers the header (used by the dashboard/simulator sections). */
  centered?: boolean;
}

/** Consistent section heading: eyebrow pill + title + optional subtitle. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = false,
}: SectionHeaderProps) {
  return (
    <div className={centered ? "mb-10 text-center" : "mb-2"}>
      <div className={centered ? "flex justify-center" : "flex"}>
        <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {eyebrow}
        </span>
      </div>
      <h2 className={`section-title mt-4 ${centered ? "" : ""}`}>{title}</h2>
      {subtitle && (
        <p className={`section-subtitle ${centered ? "mx-auto text-center" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
