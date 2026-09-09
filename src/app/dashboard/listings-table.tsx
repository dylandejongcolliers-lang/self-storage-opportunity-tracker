"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@prisma/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSIGNEES,
  MARKET_LABELS,
  STAGES,
  STAGE_BADGE_CLASS,
  STAGE_LABELS,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  type Assignee,
  type Stage,
} from "@/lib/listings";
import { deleteListing, updateListingFields } from "./actions";
import { EditListingDialog } from "./edit-listing-dialog";

type PatchFn = (
  id: string,
  fields: { stage?: Stage; assignedTo?: Assignee | null },
) => void;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`size-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 5l6 5-6 5" />
    </svg>
  );
}

function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_CLASS[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
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

function DetailField({
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

/** The expanded detail body — shared by the desktop row and the mobile card. */
function ListingDetail({
  listing,
  patch,
  onRemove,
  pending,
}: {
  listing: Listing;
  patch: PatchFn;
  onRemove: (l: Listing) => void;
  pending: boolean;
}) {
  const l = listing;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <dt className="text-xs font-medium text-slate-500">Stage</dt>
          <dd className="mt-1">
            <Select
              value={l.stage}
              onValueChange={(v) => patch(l.id, { stage: v as Stage })}
            >
              <SelectTrigger size="sm" className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Assigned to</dt>
          <dd className="mt-1">
            <Select
              value={l.assignedTo ?? "none"}
              onValueChange={(v) =>
                patch(l.id, {
                  assignedTo: v === "none" ? null : (v as Assignee),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {ASSIGNEES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Units">{formatNumber(l.unitCount)}</DetailField>
        <DetailField label="NRSF">{formatNumber(l.nrsf)}</DetailField>
        <DetailField label="First seen">
          {formatDate(l.dateFirstSeen)}
        </DetailField>
        <DetailField label="Source">
          {l.source || <span className="text-slate-400">—</span>}
        </DetailField>
        <DetailField label="Broker contact">
          {l.brokerContact || <span className="text-slate-400">—</span>}
        </DetailField>
        <DetailField label="Listing link">
          <ExternalLink href={l.listingLink}>Open</ExternalLink>
        </DetailField>
        <DetailField label="Deal room">
          <ExternalLink href={l.dealRoomLink}>Open</ExternalLink>
        </DetailField>
      </dl>

      <div>
        <dt className="text-xs font-medium text-slate-500">Internal notes</dt>
        <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">
          {l.internalNotes || <span className="text-slate-400">—</span>}
        </dd>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <EditListingDialog listing={l} />
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onRemove(l)}
          disabled={pending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function ListingsTable({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  const patch: PatchFn = (id, fields) => {
    startTransition(async () => {
      const res = await updateListingFields(id, fields);
      if (!res.ok) {
        toast.error("Could not save that change.");
        return;
      }
      router.refresh();
    });
  };

  function remove(listing: Listing) {
    if (
      !window.confirm(`Delete "${listing.propertyName}"? This cannot be undone.`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteListing(listing.id);
      if (!res.ok) {
        toast.error("Could not delete that listing.");
        return;
      }
      toast.success("Listing deleted.");
      router.refresh();
    });
  }

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
  }

  if (listings.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-900">No listings yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Use “Add listing” or “Bulk add” to enter your first opportunities.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul
        className={`divide-y divide-slate-200 md:hidden ${pending ? "opacity-60" : ""}`}
      >
        {listings.map((l) => {
          const open = openId === l.id;
          return (
            <li key={l.id} className="px-4 py-3.5">
              <button
                type="button"
                onClick={() => toggle(l.id)}
                className="flex w-full items-start gap-2 text-left"
              >
                <span className="pt-1">
                  <Chevron open={open} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-900">
                    {l.propertyName}
                  </span>
                  {l.address ? (
                    <span className="block text-xs text-slate-500">
                      {l.address}
                    </span>
                  ) : null}
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {MARKET_LABELS[l.market]}
                    </span>
                    <StageBadge stage={l.stage as Stage} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-slate-900">
                    {formatMoney(l.askingPrice)}
                  </span>
                  <span className="block text-xs tabular-nums text-slate-500">
                    {formatPercent(l.capRate)} cap
                  </span>
                </span>
              </button>

              {open ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <ListingDetail
                    listing={l}
                    patch={patch}
                    onRemove={remove}
                    pending={pending}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table
          className={pending ? "opacity-60 transition-opacity" : undefined}
        >
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent [&>th]:h-11 [&>th]:text-[13px] [&>th]:font-semibold [&>th]:text-slate-700">
              <TableHead className="w-10" />
              <TableHead className="w-full">Property</TableHead>
              <TableHead className="whitespace-nowrap">Market</TableHead>
              <TableHead className="whitespace-nowrap">Stage</TableHead>
              <TableHead className="whitespace-nowrap pr-4 text-right">
                Asking price
              </TableHead>
              <TableHead className="whitespace-nowrap pr-6 text-right">
                Cap rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((l) => {
              const open = openId === l.id;
              return (
                <Fragment key={l.id}>
                  <TableRow
                    onClick={() => toggle(l.id)}
                    className={`cursor-pointer border-slate-100 ${
                      open ? "bg-slate-50" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <TableCell className="pl-4">
                      <Chevron open={open} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {l.propertyName}
                      </div>
                      {l.address ? (
                        <div className="text-xs text-slate-500">{l.address}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {MARKET_LABELS[l.market]}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StageBadge stage={l.stage as Stage} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-4 text-right font-medium tabular-nums text-slate-900">
                      {formatMoney(l.askingPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-6 text-right tabular-nums text-slate-700">
                      {formatPercent(l.capRate)}
                    </TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={6} className="px-6 py-5">
                        <ListingDetail
                          listing={l}
                          patch={patch}
                          onRemove={remove}
                          pending={pending}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
