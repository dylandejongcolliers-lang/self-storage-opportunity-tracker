import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { ClientReactionPicker } from "@/components/client-reaction-picker";
import { listingTitle } from "@/lib/listing-title";
import {
  STAGE_BADGE_CLASS,
  STAGE_LABELS,
  formatMoney,
  formatNumber,
  formatPercent,
  type Stage,
} from "@/lib/listings";
import {
  WEEK_STATUS_BADGE,
  WEEK_STATUS_LABELS,
  isClientReaction,
} from "@/lib/clients";

export const dynamic = "force-dynamic";

async function getMatch(token: string, listingId: string) {
  const client = await prisma.client.findUnique({
    where: { shareToken: token },
    select: { id: true, name: true },
  });
  if (!client) return null;

  const match = await prisma.listingClientMatch.findFirst({
    where: { listingId, clientId: client.id, weekStatus: { not: "Passed" } },
    include: { listing: { include: { market: true } } },
  });
  if (!match) return null;

  return { client, match };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}): Promise<Metadata> {
  const { token, id } = await params;
  const found = await getMatch(token, id);
  return {
    title: {
      absolute: found
        ? listingTitle(found.match.listing)
        : "Self-Storage Opportunity Tracker",
    },
    robots: { index: false, follow: false },
  };
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

export default async function ClientListingPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const found = await getMatch(token, id);
  if (!found) notFound();

  const { client, match: m } = found;
  const l = m.listing;

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-5">
          <Logo height={32} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link
          href={`/share/${token}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to your opportunities
        </Link>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  {listingTitle(l)}
                </h1>
                {l.city || l.state ? (
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[l.city, l.state].filter(Boolean).join(", ")}
                  </p>
                ) : null}
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
                {m.weekStatus === "New" ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WEEK_STATUS_BADGE.New}`}
                  >
                    {WEEK_STATUS_LABELS.New}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Asking price" value={formatMoney(l.askingPrice)} />
              <Stat label="Cap rate" value={formatPercent(l.capRate)} />
              <Stat label="Units" value={formatNumber(l.unitCount)} />
              <Stat label="NRSF" value={formatNumber(l.nrsf)} />
            </dl>

            {m.clientFacingNotes ? (
              <p className="mt-5 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {m.clientFacingNotes}
              </p>
            ) : null}

            {l.listingLink || l.dealRoomLink ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {l.listingLink ? (
                  <a
                    href={l.listingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    View listing page →
                  </a>
                ) : null}
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
            ) : null}

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Your take on this one
              </p>
              <ClientReactionPicker
                token={token}
                matchId={m.id}
                initialReaction={
                  isClientReaction(m.clientReaction) ? m.clientReaction : null
                }
              />
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          This page is private to {client.name}. Please don&rsquo;t share the
          link.
        </p>
      </main>
    </div>
  );
}
