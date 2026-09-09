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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoardLite } from "@/lib/boards";
import { deleteBoard, renameBoard } from "./board-actions";

export function BoardSettings({
  board,
  clients,
}: {
  board: BoardLite;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(board.name);
  const [clientId, setClientId] = useState(board.clientId ?? "none");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    const fd = new FormData();
    fd.set("id", board.id);
    fd.set("name", name.trim());
    fd.set("clientId", clientId);
    startTransition(async () => {
      const res = await renameBoard(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Board updated.");
      setError(undefined);
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    if (
      !window.confirm(
        `Delete the board “${board.name}”? The listings themselves are not deleted.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteBoard(board.id);
      if (!res.ok) {
        toast.error("Could not delete the board.");
        return;
      }
      toast.success("Board deleted.");
      router.push("/dashboard");
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {board.name}
        </h2>
        <p className="text-xs text-slate-500">
          {board.count} {board.count === 1 ? "listing" : "listings"}
          {board.clientName ? ` · linked to ${board.clientName}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Board settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={remove}
        >
          Delete board
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Board settings</DialogTitle>
            <DialogDescription>
              Rename the board or loosely link it to a client from the Clients
              page. The link is optional and does not merge any data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bName">Board name</Label>
              <Input
                id="bName"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Linked client (optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
