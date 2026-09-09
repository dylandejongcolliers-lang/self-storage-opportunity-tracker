"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BoardLite } from "@/lib/boards";
import { createBoard } from "./board-actions";

export function BoardTabs({
  boards,
  activeBoardId,
}: {
  boards: BoardLite[];
  activeBoardId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function openBoard(id: string) {
    const p = new URLSearchParams(params.toString());
    p.delete("view");
    if (activeBoardId === id) p.delete("board");
    else p.set("board", id);
    const qs = p.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  function create() {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("name", name.trim());
    startTransition(async () => {
      const res = await createBoard(fd);
      if (!res.ok || !res.boardId) {
        toast.error(res.error ?? "Could not create the board.");
        return;
      }
      toast.success("Board created.");
      setOpen(false);
      setName("");
      router.push(`/dashboard?board=${res.boardId}`);
    });
  }

  const pill =
    "shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Client boards
      </span>

      {boards.length === 0 ? (
        <span className="text-sm text-slate-400">
          none yet — use “Push to client” on a listing
        </span>
      ) : (
        boards.map((b) => {
          const active = b.id === activeBoardId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => openBoard(b.id)}
              className={`${pill} ${
                active
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {b.name}
              <span
                className={`ml-1.5 text-xs ${
                  active ? "text-white/70" : "text-slate-400"
                }`}
              >
                {b.count}
              </span>
            </button>
          );
        })
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${pill} border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50`}
      >
        + New board
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New client board</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="boardName">Client name</Label>
            <Input
              id="boardName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Capital"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={create} disabled={pending}>
              {pending ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
