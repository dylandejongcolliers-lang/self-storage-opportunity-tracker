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
  MARKET_LABELS,
  formatDate,
  formatMoney,
  formatPercent,
  formatNumber,
} from "@/lib/listings";
import {
  WEEK_STATUSES,
  WEEK_STATUS_BADGE,
  WEEK_STATUS_LABELS,
  buyBoxSummary,
  sharePath,
  type WeekStatus,
} from "@/lib/clients";
import {
  confirmMatch,
  deleteClient,
  regenerateShareToken,
  removeMatch,
  updateMatch,
} from "./actions";
import { EditClientDialog } from "./edit-client-dialog";

type MatchWithListing = ListingClientMatch & { listing: Listing };

export function ClientCard({
  client,
  matches,
  suggestions,
}: {
  client: Client;
  matches: MatchWithListing[];
  suggestions: Listing[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

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
    <div className="rounded-xl border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{client.name}</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {buyBoxSummary(client)}
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
        </div>

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
          <EditClientDialog client={client} />
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
          <h3 className="text-sm font-semibold">
            Suggested from buy box ({suggestions.length})
          </h3>
          <div className="mt-2 space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No unmatched listings fit this buy box right now.
              </p>
            ) : (
              suggestions.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {l.propertyName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {MARKET_LABELS[l.market]} · {formatMoney(l.askingPrice)} ·{" "}
                      {formatPercent(l.capRate)} · {formatNumber(l.unitCount)}{" "}
                      units
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
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
          <div className="text-sm font-medium">{match.listing.propertyName}</div>
          <div className="text-muted-foreground text-xs">
            {MARKET_LABELS[match.listing.market]} ·{" "}
            {formatMoney(match.listing.askingPrice)}
          </div>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${WEEK_STATUS_BADGE[match.weekStatus as WeekStatus]}`}
        >
          {WEEK_STATUS_LABELS[match.weekStatus as WeekStatus]}
        </span>
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
