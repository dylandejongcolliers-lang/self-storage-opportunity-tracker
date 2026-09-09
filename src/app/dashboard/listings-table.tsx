"use client";

import { useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
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

const STAGE_BADGE: Record<Stage, string> = {
  New: "bg-blue-100 text-blue-800",
  TeamReviewed: "bg-amber-100 text-amber-800",
  UnderwritingOffer: "bg-green-100 text-green-800",
};

type PatchFn = (
  id: string,
  fields: { stage?: Stage; assignedTo?: Assignee | null },
) => void;

function ExternalLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </a>
  );
}

function StageSelect({
  listing,
  patch,
  width,
}: {
  listing: Listing;
  patch: PatchFn;
  width: string;
}) {
  return (
    <Select
      value={listing.stage}
      onValueChange={(v) => patch(listing.id, { stage: v as Stage })}
    >
      <SelectTrigger size="sm" className={width}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className={`rounded px-1.5 py-0.5 text-xs ${STAGE_BADGE[s]}`}>
              {STAGE_LABELS[s]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AssigneeSelect({
  listing,
  patch,
  width,
}: {
  listing: Listing;
  patch: PatchFn;
  width: string;
}) {
  return (
    <Select
      value={listing.assignedTo ?? "none"}
      onValueChange={(v) =>
        patch(listing.id, {
          assignedTo: v === "none" ? null : (v as Assignee),
        })
      }
    >
      <SelectTrigger size="sm" className={width}>
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
  );
}

export function ListingsTable({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-slate-900">No listings yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Use “Add listing” or “Bulk add” to enter your first opportunities.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div
        className={`space-y-3 md:hidden ${pending ? "opacity-60 transition-opacity" : ""}`}
      >
        {listings.map((l) => (
          <div
            key={l.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {l.listingLink ? (
                    <ExternalLink href={l.listingLink}>
                      {l.propertyName}
                    </ExternalLink>
                  ) : (
                    l.propertyName
                  )}
                </div>
                {l.address ? (
                  <div className="text-muted-foreground text-xs">{l.address}</div>
                ) : null}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {MARKET_LABELS[l.market]}
              </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Asking</dt>
                <dd className="tabular-nums">{formatMoney(l.askingPrice)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Cap</dt>
                <dd className="tabular-nums">{formatPercent(l.capRate)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Units</dt>
                <dd className="tabular-nums">{formatNumber(l.unitCount)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">NRSF</dt>
                <dd className="tabular-nums">{formatNumber(l.nrsf)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">First seen</dt>
                <dd>{formatDate(l.dateFirstSeen)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Deal room</dt>
                <dd>
                  <ExternalLink href={l.dealRoomLink}>Open</ExternalLink>
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StageSelect listing={l} patch={patch} width="w-[180px]" />
              <AssigneeSelect listing={l} patch={patch} width="w-[130px]" />
            </div>

            {l.internalNotes ? (
              <p className="text-muted-foreground mt-3 text-sm">
                {l.internalNotes}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              <EditListingDialog listing={l} />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => remove(l)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <Table className={pending ? "opacity-60 transition-opacity" : undefined}>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-slate-500">
              <TableHead className="min-w-[200px]">Property</TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="min-w-[190px]">Stage</TableHead>
              <TableHead className="text-right">Asking</TableHead>
              <TableHead className="text-right">Cap</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">NRSF</TableHead>
              <TableHead className="min-w-[140px]">Assigned</TableHead>
              <TableHead>First seen</TableHead>
              <TableHead>Deal room</TableHead>
              <TableHead className="min-w-[200px]">Internal notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((l) => (
              <TableRow key={l.id} className="hover:bg-slate-50/60">
                <TableCell>
                  <div className="font-medium">
                    {l.listingLink ? (
                      <ExternalLink href={l.listingLink}>
                        {l.propertyName}
                      </ExternalLink>
                    ) : (
                      l.propertyName
                    )}
                  </div>
                  {l.address ? (
                    <div className="text-muted-foreground text-xs">
                      {l.address}
                    </div>
                  ) : null}
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{MARKET_LABELS[l.market]}</Badge>
                </TableCell>

                <TableCell>
                  <StageSelect listing={l} patch={patch} width="w-[180px]" />
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatMoney(l.askingPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(l.capRate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(l.unitCount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(l.nrsf)}
                </TableCell>

                <TableCell>
                  <AssigneeSelect listing={l} patch={patch} width="w-[130px]" />
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {formatDate(l.dateFirstSeen)}
                </TableCell>

                <TableCell>
                  <ExternalLink href={l.dealRoomLink}>Open</ExternalLink>
                </TableCell>

                <TableCell>
                  <span
                    className="line-clamp-2 text-sm"
                    title={l.internalNotes || undefined}
                  >
                    {l.internalNotes || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <EditListingDialog listing={l} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(l)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
