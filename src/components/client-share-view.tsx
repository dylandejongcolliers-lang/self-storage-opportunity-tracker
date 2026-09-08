import type { Listing, ListingClientMatch } from "@prisma/client";
import { Wordmark } from "@/components/wordmark";
import {
  MARKET_LABELS,
  STAGE_LABELS,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  type Stage,
} from "@/lib/listings";
import {
  WEEK_STATUS_BADGE,
  WEEK_STATUS_LABELS,
  type WeekStatus,
} from "@/lib/clients";

type MatchWithListing = ListingClientMatch & { listing: Listing };

const STAGE_BADGE: Record<Stage, string> = {
  New: "bg-blue-100 text-blue-800",
  TeamReviewed: "bg-amber-100 text-amber-800",
  UnderwritingOffer: "bg-green-100 text-green-800",
};

/**
 * The exact content a client sees at /share/[token]. Rendered both there and in
 * the internal publish preview, so the two can never drift apart.
 */
export function ClientShareView({
  clientName,
  matches,
  updatedAt,
}: {
  clientName: string;
  matches: MatchWithListing[];
  updatedAt?: Date | null;
}) {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-brand-dark">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-3">
          <Wordmark tone="light" />
        </div>
      </div>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <p className="text-brand-dark text-xs font-semibold uppercase tracking-[0.2em]">
            Investment opportunities
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Prepared for {clientName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {matches.length}{" "}
            {matches.length === 1 ? "opportunity" : "opportunities"}
            {" · updated "}
            {formatDate(updatedAt ?? new Date())}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No opportunities to show yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              We&rsquo;ll be in touch as soon as something fits.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {matches.map((m) => {
              const l = m.listing;
              return (
                <li
                  key={m.id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {l.propertyName}
                      </h2>
                      {l.address ? (
                        <p className="text-sm text-slate-500">{l.address}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {MARKET_LABELS[l.market]}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[l.stage as Stage]}`}
                      >
                        {STAGE_LABELS[l.stage as Stage]}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${WEEK_STATUS_BADGE[m.weekStatus as WeekStatus]}`}
                      >
                        {WEEK_STATUS_LABELS[m.weekStatus as WeekStatus]}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    <Stat
                      label="Asking price"
                      value={formatMoney(l.askingPrice)}
                    />
                    <Stat label="Cap rate" value={formatPercent(l.capRate)} />
                    <Stat label="Units" value={formatNumber(l.unitCount)} />
                    <Stat label="NRSF" value={formatNumber(l.nrsf)} />
                  </dl>

                  {m.clientFacingNotes ? (
                    <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {m.clientFacingNotes}
                    </p>
                  ) : null}

                  {l.dealRoomLink ? (
                    <div className="mt-4">
                      <a
                        href={l.dealRoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand hover:bg-brand-dark inline-flex items-center rounded-md px-3.5 py-2 text-sm font-medium text-white"
                      >
                        Open deal room →
                      </a>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          This page is private to {clientName}. Please don&rsquo;t share the link.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}
