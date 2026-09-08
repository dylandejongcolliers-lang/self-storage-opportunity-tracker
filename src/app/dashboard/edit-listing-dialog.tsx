"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import type { Listing } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateListing, type ListingFormState } from "./actions";
import { ListingFormFields } from "./listing-form-fields";

const initial: ListingFormState = { ok: false };

export function EditListingDialog({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateListing, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Listing updated.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>{listing.propertyName}</DialogDescription>
        </DialogHeader>

        {/* `key` forces the uncontrolled fields to re-init each time the
            dialog opens, so edits always start from the saved values. */}
        <form
          key={open ? "open" : "closed"}
          action={formAction}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={listing.id} />
          <ListingFormFields listing={listing} />

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
