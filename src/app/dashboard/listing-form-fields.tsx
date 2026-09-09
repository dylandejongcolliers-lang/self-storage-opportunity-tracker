"use client";

import type { Listing } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSIGNEES, STAGES, STAGE_LABELS, toDateInputValue } from "@/lib/listings";
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

export function ListingFormFields({
  listing,
  markets,
}: {
  listing?: Listing;
  markets: MarketLite[];
}) {
  const groups = groupByRegion(markets.filter((m) => m.active));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Property name" htmlFor="propertyName" className="sm:col-span-2">
        <Input
          id="propertyName"
          name="propertyName"
          defaultValue={listing?.propertyName ?? ""}
          required
        />
      </Field>

      <Field label="Address" htmlFor="address" className="sm:col-span-2">
        <Input id="address" name="address" defaultValue={listing?.address ?? ""} />
      </Field>

      <Field label="City" htmlFor="city">
        <Input id="city" name="city" defaultValue={listing?.city ?? ""} />
      </Field>

      <Field label="State" htmlFor="state">
        <Input
          id="state"
          name="state"
          placeholder="CA"
          maxLength={20}
          defaultValue={listing?.state ?? ""}
        />
      </Field>

      <Field label="Market">
        <Select name="marketId" defaultValue={listing?.marketId ?? "auto"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Auto from state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto from state / unassigned</SelectItem>
            {groups.map(({ region, markets: list }) => (
              <SelectGroup key={region}>
                <SelectLabel>{region}</SelectLabel>
                {list.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Stage">
        <Select name="stage" defaultValue={listing?.stage ?? "New"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Date first seen" htmlFor="dateFirstSeen">
        <Input
          id="dateFirstSeen"
          name="dateFirstSeen"
          type="date"
          defaultValue={toDateInputValue(listing?.dateFirstSeen ?? new Date())}
        />
      </Field>

      <Field label="Assigned to">
        <Select name="assignedTo" defaultValue={listing?.assignedTo ?? "none"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {ASSIGNEES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Asking price (USD)" htmlFor="askingPrice">
        <Input
          id="askingPrice"
          name="askingPrice"
          inputMode="numeric"
          placeholder="e.g. 4200000"
          defaultValue={listing?.askingPrice ?? ""}
        />
      </Field>

      <Field label="Cap rate (%)" htmlFor="capRate">
        <Input
          id="capRate"
          name="capRate"
          inputMode="decimal"
          placeholder="e.g. 6.25"
          defaultValue={listing?.capRate ?? ""}
        />
      </Field>

      <Field label="Unit count" htmlFor="unitCount">
        <Input
          id="unitCount"
          name="unitCount"
          inputMode="numeric"
          defaultValue={listing?.unitCount ?? ""}
        />
      </Field>

      <Field label="NRSF" htmlFor="nrsf">
        <Input
          id="nrsf"
          name="nrsf"
          inputMode="numeric"
          placeholder="net rentable sq ft"
          defaultValue={listing?.nrsf ?? ""}
        />
      </Field>

      <Field label="Source" htmlFor="source">
        <Input
          id="source"
          name="source"
          placeholder="broker email, LoopNet, referral…"
          defaultValue={listing?.source ?? ""}
        />
      </Field>

      <Field label="Broker contact" htmlFor="brokerContact">
        <Input
          id="brokerContact"
          name="brokerContact"
          defaultValue={listing?.brokerContact ?? ""}
        />
      </Field>

      <Field label="Listing link" htmlFor="listingLink">
        <Input
          id="listingLink"
          name="listingLink"
          type="url"
          placeholder="https://…"
          defaultValue={listing?.listingLink ?? ""}
        />
      </Field>

      <Field label="Deal room link" htmlFor="dealRoomLink">
        <Input
          id="dealRoomLink"
          name="dealRoomLink"
          type="url"
          placeholder="https://…"
          defaultValue={listing?.dealRoomLink ?? ""}
        />
      </Field>

      <Field
        label="Internal notes"
        htmlFor="internalNotes"
        className="sm:col-span-2"
      >
        <Textarea
          id="internalNotes"
          name="internalNotes"
          rows={4}
          defaultValue={listing?.internalNotes ?? ""}
        />
      </Field>
    </div>
  );
}
