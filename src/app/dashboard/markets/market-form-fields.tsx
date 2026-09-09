"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MARKET_COLOR_PRESETS,
  REGION_PRESETS,
  parseStates,
  type MarketLite,
} from "@/lib/markets";

export function MarketFormFields({ market }: { market?: MarketLite }) {
  const [color, setColor] = useState(market?.color ?? MARKET_COLOR_PRESETS[0]);
  const [statesRaw, setStatesRaw] = useState(
    (market?.states ?? []).join(", "),
  );
  const preview = parseStates(statesRaw);

  return (
    <div className="space-y-4">
      <input type="hidden" name="color" value={color} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Market name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={market?.name ?? ""}
          placeholder="e.g. Phoenix Metro"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            name="region"
            list="region-presets"
            defaultValue={market?.region ?? ""}
            placeholder="West Coast"
          />
          <datalist id="region-presets">
            {REGION_PRESETS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            inputMode="numeric"
            defaultValue={market?.sortOrder ?? ""}
            placeholder="auto"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="states">States covered</Label>
        <Input
          id="states"
          name="states"
          value={statesRaw}
          onChange={(e) => setStatesRaw(e.target.value)}
          placeholder="CA, NV"
        />
        <p className="text-xs text-slate-500">
          {preview.length
            ? `Will save: ${preview.join(", ")}`
            : "USPS codes or state names, separated by commas. Used to auto-assign listings."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap items-center gap-2">
          {MARKET_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-7 rounded-full ring-offset-2 transition ${
                color === c ? "ring-2 ring-slate-900" : "ring-1 ring-slate-300"
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-28 font-mono text-xs"
            aria-label="Custom hex color"
          />
        </div>
      </div>
    </div>
  );
}
