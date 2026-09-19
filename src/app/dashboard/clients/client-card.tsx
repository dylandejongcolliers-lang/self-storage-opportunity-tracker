"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Client, Listing, ListingClientMatch } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatNumber,
} from "@/lib/listings";
import type { MarketLite } from "@/lib/markets";
import { listingTitle } from "@/lib/listing-title";
import {
  WEEK_STATUSES,
  WEEK_STATUS_BADGE,
  WEEK_STATUS_LABELS,
  CLIENT_REACTION_BADGE,
  CLIENT_REACTION_LABELS,
  buyBoxSummary,
  isClientReaction,
  sharePath,
  type WeekStatus,
} from "@/lib/clients";
import {
  confirmMatch,
  confirmMatches,
  deleteClient,
  regenerateShareToken,
  removeMatch,
  updateMatch,
} from "./actions";
import { EditClientDialog } from "./edit-client-dialog";

type ListingWithMarket = Listing & { market: MarketLite | null };
type MatchWithListing = ListingClientMatch & { listing: ListingWithMarket };

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`mt-1 size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
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

export function ClientCard({
  client,
  matches,
  suggestions,
  markets,
}: {
  client: Client;
  matches: MatchWithListing[];
  suggestions: ListingWithMarket[];
  markets: MarketLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const marketName = (slug: string) =>
    markets.find((m) => m.slug === slug)?.name ?? slug;

  function run(fn: () => Promise<{ ok: boolean }>, errorMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(errorMsg);
        return;
      }
      router.refresh();
    });
  }

  function toggleSuggestion(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSuggestionsSelected =
    suggestions.length > 0 && suggestions.every((l) => selected.has(l.id));

  function toggleSelectAllSuggestions() {
    setSelected(
      allSuggestionsSelected ? new Set() : new Set(suggestions.map((l) => l.id)),
    );
  }

  function confirmSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await confirmMatches(ids, client.id);
      if (!res.ok) {
        toast.error("Could not confirm those matches.");
        return;
      }
      toast.success(
        res.count === 1
          ? "Confirmed 1 match."
          : `Confirmed ${res.count} matches.`,
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  function copyShareLink() {
    const url =
      (typeof window !== "undefined" ? window.location.origin : "") +
      sharePath(client.shareToken);
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast.error("Could not copy."),
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 items-start gap-2 text-left"
        >
          <Chevron open={!collapsed} />
          <span className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {client.name}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {buyBoxSummary(client, marketName)}
            </p>
            {client.buyBoxNotes ? (
              <p className="text-muted-foreground mt-1 text-xs italic">
                {client.buyBoxNotes}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-1 text-xs">
              {client.lastPublishedAt
                ? `Last published ${formatDate(client.lastPublishedAt)}`
                : "Never published"}
            </p>
          </span>
        </button>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button size="sm" asChild>
            <Link href={`/dashboard/clients/${client.id}/publish`}>
              Publish…
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={sharePath(client.shareToken)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={copyShareLink}>
            {copied ? "Copied!" : "Copy share link"}
          </Button>
          <EditClientDialog client={client} markets={markets} />
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (
                window.confirm(
                  `Delete client "${client.name}" and all their matches?`,
                )
              ) {
                run(
                  () => deleteClient(client.id),
                  "Could not delete the client.",
                );
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {collapsed ? null : (
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        {/* Confirmed matches */}
        <div>
          <h3 className="text-sm font-semibold">
            Confirmed matches ({matches.length})
          </h3>
          <div className="mt-2 space-y-3">
            {matches.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                None yet. Confirm one from the suggestions.
              </p>
            ) : (
              matches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  pending={pending}
                  onStatus={(weekStatus) =>
                    run(
                      () => updateMatch(m.id, { weekStatus }),
                      "Could not update status.",
                    )
                  }
                  onSaveNotes={(clientFacingNotes) =>
                    run(
                      () => updateMatch(m.id, { clientFacingNotes }),
                      "Could not save notes.",
                    )
                  }
                  onRemove={() =>
                    run(() => removeMatch(m.id), "Could not remove the match.")
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Suggestions from the buy box */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Suggested from buy box ({suggestions.length})
            </h3>
            {suggestions.length > 0 ? (
              <button
                type="button"
                onClick={toggleSelectAllSuggestions}
                className="text-muted-foreground hover:text-foreground text-xs underline"
              >
                {allSuggestionsSelected ? "Clear" : "Select all"}
              </button>
            ) : null}
          </div>

          <div className="mt-2 space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No unmatched listings fit this buy box right now.
              </p>
            ) : (
              suggestions.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-slate-300"
                    checked={selected.has(l.id)}
                    onChange={() => toggleSuggestion(l.id)}
                    aria-label={`Select ${l.propertyName}`}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/listings/${l.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                      title={listingTitle(l)}
                    >
                      {listingTitle(l)}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {l.market?.name ?? "Needs market"} ·{" "}
                      {formatMoney(l.askingPrice)} · {formatPercent(l.capRate)} ·{" "}
                      {formatNumber(l.unitCount)} units
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => confirmMatch(l.id, client.id),
                        "Could not confirm the match.",
                      )
                    }
                  >
                    Confirm
                  </Button>
                </div>
              ))
            )}
          </div>

          {selected.size > 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-200">
              <span className="text-sm font-medium text-slate-900">
                {selected.size} selected
              </span>
              <Button
                size="sm"
                className="ml-auto"
                disabled={pending}
                onClick={confirmSelected}
              >
                Confirm selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              run(
                () => regenerateShareToken(client.id),
                "Could not regenerate the link.",
              )
            }
            className="text-muted-foreground hover:text-foreground mt-4 text-xs underline"
          >
            Regenerate share link
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

function MatchRow({
  match,
  pending,
  onStatus,
  onSaveNotes,
  onRemove,
}: {
  match: MatchWithListing;
  pending: boolean;
  onStatus: (s: WeekStatus) => void;
  onSaveNotes: (notes: string) => void;
  onRemove: () => void;
}) {
  const [notes, setNotes] = useState(match.clientFacingNotes);
  const dirty = notes !== match.clientFacingNotes;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/dashboard/listings/${match.listing.id}`}
            className="text-sm font-medium hover:underline"
          >
            {listingTitle(match.listing)}
          </Link>
          <div className="text-muted-foreground text-xs">
            {match.listing.market?.name ?? "Needs market"} ·{" "}
            {formatMoney(match.listing.askingPrice)}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded px-1.5 py-0.5 text-xs ${WEEK_STATUS_BADGE[match.weekStatus as WeekStatus]}`}
          >
            {WEEK_STATUS_LABELS[match.weekStatus as WeekStatus]}
          </span>
          {isClientReaction(match.clientReaction) ? (
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${CLIENT_REACTION_BADGE[match.clientReaction]}`}
            >
              {CLIENT_REACTION_LABELS[match.clientReaction]}
            </span>
          ) : null}
        </div>
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes the client will see for this listing…"
        className="mt-2 text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={!dirty || pending}
          onClick={() => onSaveNotes(notes)}
        >
          {dirty ? "Save notes" : "Saved"}
        </Button>

        <Select
          value={match.weekStatus}
          onValueChange={(v) => onStatus(v as WeekStatus)}
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {WEEK_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive ml-auto"
          disabled={pending}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
