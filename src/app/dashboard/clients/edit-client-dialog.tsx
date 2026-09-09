"use client";

import { useState, useTransition } from "react";
import type { Client } from "@prisma/client";
import { toast } from "sonner";
import type { MarketLite } from "@/lib/markets";
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
import { updateClient } from "./actions";
import { ClientFormFields } from "./client-form-fields";

export function EditClientDialog({
  client,
  markets,
}: {
  client: Client;
  markets: MarketLite[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateClient(formData);
      if (res.ok) {
        toast.success("Buy box saved.");
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
          Edit buy box
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit buy box</DialogTitle>
          <DialogDescription>{client.name}</DialogDescription>
        </DialogHeader>

        <form key={open ? "open" : "closed"} action={onSubmit} className="space-y-4">
          <input type="hidden" name="id" value={client.id} />
          <ClientFormFields client={client} markets={markets} />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

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
