import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl text-center">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
          Internal tool
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Self-Storage Opportunity Tracker
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          Track self-storage investment sale opportunities from first sighting
          through client offer.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Open the dashboard</Link>
          </Button>
        </div>

        <div className="mt-10 rounded-xl border bg-white p-6 text-left shadow-sm">
          <h2 className="text-sm font-semibold">Status</h2>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>✓ Phase 1 — project scaffolded &amp; hosting proven</li>
            <li>✓ Phase 2 — listing tracker (/dashboard)</li>
            <li>✓ Phase 3 — clients &amp; buy-box matching</li>
            <li>✓ Phase 4 — client share pages</li>
            <li>✓ Phase 5 — weekly snapshot publishing</li>
            <li className="opacity-60">
              • Phase 6 — styling, mobile &amp; branding
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
