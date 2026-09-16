"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { flagListingsForReview } from "./actions";

export function FlagForReviewDialog({
  open,
  onOpenChange,
  listingIds,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingIds: string[];
  onDone?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <FlagBody
            listingIds={listingIds}
            close={() => onOpenChange(false)}
            onDone={onDone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FlagBody({
  listingIds,
  close,
  onDone,
}: {
  listingIds: string[];
  close: () => void;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const count = listingIds.length;

  function submit() {
    startTransition(async () => {
      const res = await flagListingsForReview(listingIds, reason.trim());
      if (!res.ok) {
        toast.error("Could not flag that for review.");
        return;
      }
      toast.success(
        count === 1
          ? "Flagged for review."
          : `Flagged ${res.count ?? count} listings for review.`,
      );
      close();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Flag for review</DialogTitle>
        <DialogDescription>
          {count === 1
            ? "Puts this listing in the Review queue tab."
            : `Puts ${count} listings in the Review queue tab.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="flagReason">Reason (optional)</Label>
        <Textarea
          id="flagReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="what needs a second look…"
          rows={3}
          maxLength={500}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Flagging…" : "Flag for review"}
        </Button>
      </DialogFooter>
    </>
  );
}
