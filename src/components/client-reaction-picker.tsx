"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CLIENT_REACTIONS,
  CLIENT_REACTION_LABELS,
  CLIENT_REACTION_PILL,
  type ClientReaction,
} from "@/lib/clients";
import { setClientReaction } from "@/app/share/actions";

/**
 * The Green (Review further) / Yellow (Maybe) / Red (Not interested) picker
 * a client leaves on a listing from their share page. No login — the token
 * stands in for auth, checked server-side on every write.
 */
export function ClientReactionPicker({
  token,
  matchId,
  initialReaction,
}: {
  token: string;
  matchId: string;
  initialReaction: ClientReaction | null;
}) {
  const [reaction, setReaction] = useState(initialReaction);
  const [pending, startTransition] = useTransition();

  function pick(next: ClientReaction) {
    const target = reaction === next ? null : next; // click again to clear
    const prev = reaction;
    setReaction(target);
    startTransition(async () => {
      const res = await setClientReaction(token, matchId, target);
      if (!res.ok) {
        setReaction(prev);
        toast.error("Could not save your review. Please try again.");
        return;
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CLIENT_REACTIONS.map((r) => {
        const selected = reaction === r;
        return (
          <button
            key={r}
            type="button"
            disabled={pending}
            onClick={() => pick(r)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
              selected
                ? CLIENT_REACTION_PILL[r]
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {CLIENT_REACTION_LABELS[r]}
          </button>
        );
      })}
    </div>
  );
}
