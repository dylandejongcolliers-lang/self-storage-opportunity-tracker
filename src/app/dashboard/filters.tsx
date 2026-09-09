"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SORTS, SORT_LABELS, STAGES, STAGE_LABELS } from "@/lib/listings";
import { groupByRegion, type MarketLite } from "@/lib/markets";

export function Filters({
  market,
  stage,
  sort,
  markets,
}: {
  market: string;
  stage: string;
  sort: string;
  markets: MarketLite[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const groups = groupByRegion(markets);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  const hasFilters = market !== "all" || stage !== "all" || sort !== "newest";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={market} onValueChange={(v) => setParam("market", v)}>
        <SelectTrigger className="w-[190px]" size="sm">
          <SelectValue placeholder="Market" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All markets</SelectItem>
          <SelectItem value="unassigned">Needs assignment</SelectItem>
          {groups.map(({ region, markets: list }) => (
            <SelectGroup key={region}>
              <SelectLabel>{region}</SelectLabel>
              {list.map((m) => (
                <SelectItem key={m.id} value={m.slug}>
                  {m.name}
                  {m.active ? "" : " · inactive"}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <Select value={stage} onValueChange={(v) => setParam("stage", v)}>
        <SelectTrigger className="w-[180px]" size="sm">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {STAGE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
        <SelectTrigger className="w-[190px]" size="sm">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => (
            <SelectItem key={s} value={s}>
              {SORT_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
