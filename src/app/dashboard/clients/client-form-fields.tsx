"use client";

import type { Client } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { groupByRegion, type MarketLite } from "@/lib/markets";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function ClientFormFields({
  client,
  markets,
}: {
  client?: Client;
  markets: MarketLite[];
}) {
  const selected = new Set(client?.buyBoxMarkets ?? []);
  const groups = groupByRegion(markets.filter((m) => m.active));

  return (
    <div className="space-y-4">
      <Field label="Client name" htmlFor="name">
        <Input id="name" name="name" defaultValue={client?.name ?? ""} required />
      </Field>

      <div className="space-y-1.5">
        <Label>Buy-box markets</Label>
        <p className="text-muted-foreground text-xs">
          Leave all unchecked to match any market.
        </p>
        <div className="space-y-3 pt-1">
          {groups.map(({ region, markets: list }) => (
            <div key={region}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {region}
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {list.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-sm font-normal"
                  >
                    <input
                      type="checkbox"
                      name="buyBoxMarkets"
                      value={m.slug}
                      defaultChecked={selected.has(m.slug)}
                      className="border-input size-4 rounded"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price min (USD)" htmlFor="buyBoxPriceMin">
          <Input
            id="buyBoxPriceMin"
            name="buyBoxPriceMin"
            inputMode="numeric"
            placeholder="e.g. 2000000"
            defaultValue={client?.buyBoxPriceMin ?? ""}
          />
        </Field>
        <Field label="Price max (USD)" htmlFor="buyBoxPriceMax">
          <Input
            id="buyBoxPriceMax"
            name="buyBoxPriceMax"
            inputMode="numeric"
            placeholder="e.g. 8000000"
            defaultValue={client?.buyBoxPriceMax ?? ""}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Min cap rate (%)" htmlFor="buyBoxCapRateMin">
          <Input
            id="buyBoxCapRateMin"
            name="buyBoxCapRateMin"
            inputMode="decimal"
            placeholder="e.g. 6"
            defaultValue={client?.buyBoxCapRateMin ?? ""}
          />
        </Field>
        <Field label="Units min" htmlFor="buyBoxUnitMin">
          <Input
            id="buyBoxUnitMin"
            name="buyBoxUnitMin"
            inputMode="numeric"
            defaultValue={client?.buyBoxUnitMin ?? ""}
          />
        </Field>
        <Field label="Units max" htmlFor="buyBoxUnitMax">
          <Input
            id="buyBoxUnitMax"
            name="buyBoxUnitMax"
            inputMode="numeric"
            defaultValue={client?.buyBoxUnitMax ?? ""}
          />
        </Field>
      </div>

      <Field label="Buy-box notes" htmlFor="buyBoxNotes">
        <Textarea
          id="buyBoxNotes"
          name="buyBoxNotes"
          rows={3}
          placeholder="Anything that doesn't fit the fields above — 1031 timing, construction appetite, etc."
          defaultValue={client?.buyBoxNotes ?? ""}
        />
      </Field>
    </div>
  );
}
