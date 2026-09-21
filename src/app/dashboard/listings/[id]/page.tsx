import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
  CLIENT_REACTION_BADGE,
  CLIENT_REACTION_LABELS,
  isClientReaction,
  type WeekStatus,
} from "@/lib/clients";
import { listingTitle } from "@/lib/listing-title";
import { EditListingDialog } from "../../edit-listing-dialog";
import { DeleteListingButton } from "./delete-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { propertyName: true, address: true },
  });
  return { title: listing ? listingTitle(listing) : "Listing" };
}

function ExternalLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <span className="text-slate-400">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand font-medium underline underline-offset-2"
    >
      {children}
    </a>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { from } = await searchParams;
  const fromClient = from
    ? await prisma.client.findUnique({
        where: { id: from },
        select: { id: true, name: true },
      })
    : null;

  const [listing, markets] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        market: true,
        matches: {
          include: { client: { select: { id: true, name: true } } },
          orderBy: { matchedAt: "desc" },
        },
        boardLinks: {
          include: { board: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.market.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!listing) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={
          fromClient
            ? `/dashboard/clients?open=${fromClient.id}`
            : "/dashboard"
        }
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        {fromClient ? `← Back to ${fromClient.name}` : "← Back to listings"}
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {listingTitle(listing)}
            </h1>
            {listing.city || listing.state ? (
              <p className="mt-0.5 text-sm text-slate-500">
                {[listing.city, listing.state].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {listing.market ? (
                <>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: listing.market.color }}
                  />
                  {listing.market.name}
                </>
              ) : (
                "Needs market"
              )}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_CLASS[listing.stage as Stage]}`}
            >
              {STAGE_LABELS[listing.stage as Stage]}
            </span>
            {listing.flaggedForReview ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/25">
                Flagged
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <EditListingDialog listing={listing} markets={markets} />
          <DeleteListingButton
            id={listing.id}
            propertyName={listing.propertyName}
          />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Asking price">{formatMoney(listing.askingPrice)}</Field>
          <Field label="Cap rate">{formatPercent(listing.capRate)}</Field>
          <Field label="Units">{formatNumber(listing.unitCount)}</Field>
          <Field label="NRSF">{formatNumber(listing.nrsf)}</Field>
          <Field label="First seen">{formatDate(listing.dateFirstSeen)}</Field>
          <Field label="Source">
            {listing.source || <span className="text-slate-400">—</span>}
          </Field>
          <Field label="Assigned to">
            {listing.assignedTo ?? <span className="text-slate-400">—</span>}
          </Field>
          <Field label="Broker contact">
            {listing.brokerContact || (
              <span className="text-slate-400">—</span>
            )}
          </Field>
          <Field label="Listing link">
            <ExternalLink href={listing.listingLink}>Open</ExternalLink>
          </Field>
          <Field label="Deal room">
            <ExternalLink href={listing.dealRoomLink}>Open</ExternalLink>
          </Field>
        </dl>

        <div className="mt-6">
          <dt className="text-xs font-medium text-slate-500">
            Internal notes
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">
            {listing.internalNotes || (
              <span className="text-slate-400">—</span>
            )}
          </dd>
        </div>

        {listing.flaggedForReview && listing.flagReason ? (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
            <span className="font-medium">Flag reason:</span>{" "}
            {listing.flagReason}
          </div>
        ) : null}

        {listing.boardLinks.length > 0 ? (
          <div className="mt-6">
            <dt className="text-xs font-medium text-slate-500">
              On boards
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {listing.boardLinks.map((bl) => (
                <Link
                  key={bl.board.id}
                  href={`/dashboard?board=${bl.board.id}`}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  {bl.board.name}
                </Link>
              ))}
            </dd>
          </div>
        ) : null}

        {listing.matches.length > 0 ? (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <dt className="text-xs font-medium text-slate-500">
              Matched to clients
            </dt>
            <dd className="mt-2 space-y-2">
              {listing.matches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <Link
                    href="/dashboard/clients"
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {m.client.name}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${WEEK_STATUS_BADGE[m.weekStatus as WeekStatus]}`}
                  >
                    {WEEK_STATUS_LABELS[m.weekStatus as WeekStatus]}
                  </span>
                  {isClientReaction(m.clientReaction) ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLIENT_REACTION_BADGE[m.clientReaction]}`}
                    >
                      {CLIENT_REACTION_LABELS[m.clientReaction]}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      No client review yet
                    </span>
                  )}
                </div>
              ))}
            </dd>
          </div>
        ) : null}
      </div>
    </div>
  );
}
