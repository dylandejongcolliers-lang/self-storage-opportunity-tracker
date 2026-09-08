import Link from "next/link";

/**
 * Text-only brand lockup. Colliers-flavored styling for an internal Colliers
 * tool — not an official logo. Swap in real brand assets later if wanted.
 */
export function Wordmark({
  href,
  tone = "light",
}: {
  href?: string;
  /** "light" for use on the navy bar, "dark" for use on white. */
  tone?: "light" | "dark";
}) {
  const nameClass = tone === "light" ? "text-white" : "text-brand-dark";
  const subClass = tone === "light" ? "text-white/60" : "text-slate-400";

  const inner = (
    <span className="flex items-baseline gap-2">
      <span
        className={`text-sm font-bold uppercase tracking-[0.18em] ${nameClass}`}
      >
        Colliers
      </span>
      <span className={`hidden text-xs sm:inline ${subClass}`}>
        Self-Storage Opportunity Tracker
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="shrink-0">
      {inner}
    </Link>
  ) : (
    <span className="shrink-0">{inner}</span>
  );
}
