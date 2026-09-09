"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { groupByRegion, type MarketLite } from "@/lib/markets";
import { createMarket, setMarketActive, updateMarket } from "./actions";
import { MarketFormFields } from "./market-form-fields";

function MarketDialog({
  market,
  trigger,
}: {
  market?: MarketLite;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = market
        ? await updateMarket(formData)
        : await createMarket(formData);
      if (res.ok) {
        toast.success(market ? "Market updated." : "Market added.");
        setError(undefined);
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{market ? "Edit market" : "Add market"}</DialogTitle>
          <DialogDescription>
            {market
              ? market.name
              : "Markets are available everywhere immediately — no redeploy."}
          </DialogDescription>
        </DialogHeader>

        <form
          key={open ? "open" : "closed"}
          action={onSubmit}
          className="space-y-4"
        >
          {market ? (
            <input type="hidden" name="id" value={market.id} />
          ) : null}
          <MarketFormFields market={market} />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : market ? "Save changes" : "Add market"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarketManager({
  markets,
  counts,
}: {
  markets: MarketLite[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const groups = groupByRegion(markets);

  function toggleActive(m: MarketLite) {
    startTransition(async () => {
      const res = await setMarketActive(m.id, !m.active);
      if (!res.ok) {
        toast.error("Could not update the market.");
        return;
      }
      toast.success(m.active ? "Market deactivated." : "Market reactivated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {markets.length} {markets.length === 1 ? "market" : "markets"}
        </p>
        <MarketDialog trigger={<Button>Add market</Button>} />
      </div>

      {groups.map(({ region, markets: list }) => (
        <div key={region}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {region}
          </h2>
          <div
            className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
              pending ? "opacity-60" : ""
            }`}
          >
            {list.map((m, i) => (
              <div
                key={m.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                  i > 0 ? "border-t border-slate-100" : ""
                } ${m.active ? "" : "bg-slate-50/60"}`}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{m.name}</span>
                    {!m.active ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        inactive
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.slug}
                    {m.states.length ? ` · ${m.states.join(", ")}` : ""}
                    {` · ${counts[m.id] ?? 0} ${
                      (counts[m.id] ?? 0) === 1 ? "listing" : "listings"
                    }`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MarketDialog
                    market={m}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => toggleActive(m)}
                    className={m.active ? "text-slate-500" : "text-brand"}
                  >
                    {m.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
