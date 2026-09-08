"use client";

import { useActionState, useEffect, useState } from "react";
import type { Client } from "@prisma/client";
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
import { updateClient, type ClientFormState } from "./actions";
import { ClientFormFields } from "./client-form-fields";

const initial: ClientFormState = { ok: false };

export function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateClient, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Buy box saved.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit buy box
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit buy box</DialogTitle>
          <DialogDescription>{client.name}</DialogDescription>
        </DialogHeader>

        <form
          key={open ? "open" : "closed"}
          action={formAction}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={client.id} />
          <ClientFormFields client={client} />

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save buy box"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
