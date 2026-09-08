"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
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
import { createListing, type ListingFormState } from "./actions";
import { ListingFormFields } from "./listing-form-fields";

const initial: ListingFormState = { ok: false };

export function AddListingDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createListing, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Listing added.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add listing</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add listing</DialogTitle>
          <DialogDescription>
            Manually enter a self-storage sale opportunity.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <ListingFormFields />

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
              {pending ? "Saving…" : "Save listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
