"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { publishSnapshot } from "@/app/dashboard/clients/actions";

export function PublishButton({
  clientId,
  pendingCount,
}: {
  clientId: string;
  /** How many matches will flip from New/Updated to Carried over. */
  pendingCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function publish() {
    startTransition(async () => {
      const res = await publishSnapshot(clientId);
      if (!res.ok) {
        toast.error("Could not publish the snapshot.");
        return;
      }
      toast.success(
        res.carriedOver
          ? `Published. ${res.carriedOver} moved to "Carried over".`
          : "Published.",
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Publish Weekly Snapshot</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish this week&rsquo;s snapshot?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                This stamps today as the published date on the client&rsquo;s
                share page.
              </p>
              <p>
                {pendingCount > 0 ? (
                  <>
                    <strong>
                      {pendingCount}{" "}
                      {pendingCount === 1 ? "listing" : "listings"}
                    </strong>{" "}
                    currently marked <em>New</em> or <em>Updated</em> will move to{" "}
                    <em>Carried over</em>.
                  </>
                ) : (
                  <>Nothing is marked New or Updated, so no badges will change.</>
                )}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={publish} disabled={pending}>
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
