"use client";

import { useActionState, useEffect, useState } from "react";
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
import { createClient, type ClientFormState } from "./actions";
import { ClientFormFields } from "./client-form-fields";

const initial: ClientFormState = { ok: false };

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClient, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Client added.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add client</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>
            A share link is generated automatically.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <ClientFormFields />

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
