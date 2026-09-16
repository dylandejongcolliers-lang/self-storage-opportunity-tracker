"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { matchListingsToClient } from "./match-actions";

export type ClientLite = { id: string; name: string };

export function MatchToClientDialog({
  open,
  onOpenChange,
  listingIds,
  clients,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingIds: string[];
  clients: ClientLite[];
  onDone?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <MatchBody
            listingIds={listingIds}
            clients={clients}
            close={() => onOpenChange(false)}
            onDone={onDone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MatchBody({
  listingIds,
  clients,
  close,
  onDone,
}: {
  listingIds: string[];
  clients: ClientLite[];
  close: () => void;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"existing" | "new">(
    clients.length ? "existing" : "new",
  );
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");

  const count = listingIds.length;

  function submit() {
    if (mode === "existing" && !clientId) return;
    if (mode === "new" && !newName.trim()) return;

    const target =
      mode === "existing" ? { clientId } : { newClientName: newName.trim() };

    startTransition(async () => {
      const res = await matchListingsToClient(listingIds, target, note);
      if (!res.ok) {
        toast.error(res.error ?? "Could not create the match.");
        return;
      }
      const matched = res.matched ?? 0;
      const already = res.alreadyMatched ?? 0;
      toast.success(
        already > 0
          ? `Matched ${matched} to ${res.clientName}'s buy box (${already} already matched).`
          : `Matched ${matched} to ${res.clientName}'s buy box.`,
      );
      close();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Push to client buy box</DialogTitle>
        <DialogDescription>
          {count === 1
            ? "Match this listing to a client — it'll appear on their weekly snapshot and share page once published."
            : `Match ${count} listings to a client — they'll appear on that client's weekly snapshot and share page once published.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {clients.length > 0 ? (
          <div className="space-y-2">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`flex-1 rounded-md px-3 py-1.5 font-medium ${
                  mode === "existing"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Existing client
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`flex-1 rounded-md px-3 py-1.5 font-medium ${
                  mode === "new"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                New client
              </button>
            </div>

            {mode === "existing" ? (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {clients.map((c) => (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm ${
                      clientId === c.id ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="client"
                      className="mr-2"
                      checked={clientId === c.id}
                      onChange={() => setClientId(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "new" ? (
          <div className="space-y-1.5">
            <Label htmlFor="newClientName">Client name</Label>
            <Input
              id="newClientName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ryan Brown"
              autoFocus
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="matchNote">Client-facing note (optional)</Label>
          <Input
            id="matchNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why this fits their buy box…"
            maxLength={280}
          />
          <p className="text-xs text-slate-500">
            Shown to the client on their share page — leave blank to keep any
            existing note as-is for listings already matched.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Matching…" : "Match to client"}
        </Button>
      </DialogFooter>
    </>
  );
}
