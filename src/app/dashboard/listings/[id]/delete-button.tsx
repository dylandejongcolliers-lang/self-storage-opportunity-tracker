"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteListing } from "../../actions";

export function DeleteListingButton({
  id,
  propertyName,
}: {
  id: string;
  propertyName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !window.confirm(`Delete "${propertyName}"? This cannot be undone.`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteListing(id);
      if (!res.ok) {
        toast.error("Could not delete that listing.");
        return;
      }
      toast.success("Listing deleted.");
      router.push("/dashboard");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={onClick}
    >
      Delete
    </Button>
  );
}
