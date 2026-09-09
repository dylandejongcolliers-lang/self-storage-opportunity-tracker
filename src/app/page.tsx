import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-5">
          <Logo height={32} />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-xl text-center">
          <p className="text-brand text-xs font-semibold uppercase tracking-[0.18em]">
            Internal tool
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Self-Storage Opportunity Tracker
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Track self-storage investment sale opportunities from first sighting
            through client offer.
          </p>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">Open the dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
