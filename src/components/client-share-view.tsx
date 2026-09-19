import Link from "next/link";
import type { Listing, ListingClientMatch } from "@prisma/client";
import { Logo } from "@/components/logo";
import { ClientReactionPicker } from "@/components/client-reaction-picker";
import { listingTitle } from "@/lib/listing-title";
import {
  STAGE_BADGE_CLASS,
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
  isClientReaction,
  type WeekStatus,
} from "@/lib/clients";

type MatchWithListing = ListingClientMatch & {
  listing: Listing & { market: { name: string } | null };
};

/**
 * The exact content a client sees at /share/[token]. Rendered both there and in
 * the internal publish preview, so the two can never drift apart.
 */
export function ClientShareView({
  clientName,
  matches,
  updatedAt,
  token,
}: {
  clientName: string;
  matches: MatchWithListing[];
  updatedAt?: Date | null;
  /** The client's real share token — always passed, including from the
   *  internal publish preview, so every link (and the reaction picker)
   *  works exactly the same way there as it does for the client. */
  token: string;
}) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-5">
          <Logo height={32} />
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-7">
          <p className="text-brand text-xs font-semibold uppercase tracking-[0.18em]">
            Investment opportunities
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
            Prepared for {clientName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {matches.length}{" "}
            {matches.length === 1 ? "opportunity" : "opportunities"}
            {" · updated "}
            {formatDate(updatedAt ?? new Date())}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
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
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                          <Link
                            href={`/share/${token}/listing/${l.id}`}
                            className="hover:text-brand hover:underline"
                          >
                            {listingTitle(l)}
                          </Link>
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {l.market?.name ?? "—"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_CLASS[l.stage as Stage]}`}
                        >
                          {STAGE_LABELS[l.stage as Stage]}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WEEK_STATUS_BADGE[m.weekStatus as WeekStatus]}`}
                        >
                          {WEEK_STATUS_LABELS[m.weekStatus as WeekStatus]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                      <Stat
                        label="Asking price"
                        value={formatMoney(l.askingPrice)}
                      />
                      <Stat label="Cap rate" value={formatPercent(l.capRate)} />
                      <Stat label="Units" value={formatNumber(l.unitCount)} />
                      <Stat label="NRSF" value={formatNumber(l.nrsf)} />
                    </dl>

                    {m.clientFacingNotes ? (
                      <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
                        {m.clientFacingNotes}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <ListingPageLink token={token} listing={l} />
                      {l.dealRoomLink ? (
                        <a
                          href={l.dealRoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand hover:bg-brand-dark inline-flex items-center rounded-md px-3.5 py-2 text-sm font-medium text-white transition-colors"
                        >
                          Open deal room →
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-2 text-xs font-medium text-slate-500">
                        Your take on this one
                      </p>
                      <ClientReactionPicker
                        token={token}
                        matchId={m.id}
                        initialReaction={
                          isClientReaction(m.clientReaction)
                            ? m.clientReaction
                            : null
                        }
                      />
                    </div>
                  </div>
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

/**
 * Always renders a clickable "View listing page" link — the original
 * source (Crexi, a brokerage site, etc.) when we have one, otherwise our
 * own listing detail page, so a client always has something to click
 * through to.
 */
function ListingPageLink({
  token,
  listing,
}: {
  token: string;
  listing: Listing;
}) {
  const className =
    "inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50";

  if (listing.listingLink) {
    return (
      <a
        href={listing.listingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        View listing page →
      </a>
    );
  }

  return (
    <Link href={`/share/${token}/listing/${listing.id}`} className={className}>
      View listing page →
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}
