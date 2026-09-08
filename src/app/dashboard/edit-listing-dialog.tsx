"use client";

import { useState, useTransition } from "react";
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
import { updateListing } from "./actions";
import { ListingFormFields } from "./listing-form-fields";

export function EditListingDialog({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateListing(formData);
      if (res.ok) {
        toast.success("Listing updated.");
        setError(undefined);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

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

        {/* `key` re-inits the uncontrolled fields each time the dialog opens. */}
        <form key={open ? "open" : "closed"} action={onSubmit} className="space-y-4">
          <input type="hidden" name="id" value={listing.id} />
          <ListingFormFields listing={listing} />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
