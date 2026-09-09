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
import type { BoardLite } from "@/lib/boards";
import { pushListingsToBoard } from "./board-actions";

export function PushToBoardDialog({
  open,
  onOpenChange,
  listingIds,
  boards,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingIds: string[];
  boards: BoardLite[];
  onDone?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <PushBody
            listingIds={listingIds}
            boards={boards}
            close={() => onOpenChange(false)}
            onDone={onDone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PushBody({
  listingIds,
  boards,
  close,
  onDone,
}: {
  listingIds: string[];
  boards: BoardLite[];
  close: () => void;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"existing" | "new">(
    boards.length ? "existing" : "new",
  );
  const [boardId, setBoardId] = useState<string>(boards[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");

  const count = listingIds.length;

  function submit() {
    const target =
      mode === "existing" ? { boardId } : { newName: newName.trim() };
    if (mode === "existing" && !boardId) return;
    if (mode === "new" && !newName.trim()) return;

    startTransition(async () => {
      const res = await pushListingsToBoard(listingIds, target, note);
      if (!res.ok) {
        toast.error(res.error ?? "Could not push to the board.");
        return;
      }
      const added = res.added ?? 0;
      const dup = res.alreadyThere ?? 0;
      toast.success(
        dup > 0
          ? `Added ${added} to “${res.boardName}” (${dup} already there).`
          : `Added ${added} to “${res.boardName}”.`,
      );
      close();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Push to client board</DialogTitle>
        <DialogDescription>
          {count === 1
            ? "Add this listing to a client board."
            : `Add ${count} listings to a client board.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {boards.length > 0 ? (
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
                Existing board
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
                {boards.map((b) => (
                  <label
                    key={b.id}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${
                      boardId === b.id ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="board"
                        checked={boardId === b.id}
                        onChange={() => setBoardId(b.id)}
                      />
                      {b.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {b.count} {b.count === 1 ? "listing" : "listings"}
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "new" ? (
          <div className="space-y-1.5">
            <Label htmlFor="newBoardName">Client name</Label>
            <Input
              id="newBoardName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ryan Brown"
              autoFocus
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="boardNote">Note (optional)</Label>
          <Input
            id="boardNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why this fits, next step…"
            maxLength={280}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Adding…" : "Add to board"}
        </Button>
      </DialogFooter>
    </>
  );
}
