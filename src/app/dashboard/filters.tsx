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
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_DOT,
  REVIEW_STATUS_LABELS,
  SORTS,
  SORT_LABELS,
  STAGES,
  STAGE_LABELS,
} from "@/lib/listings";
import { groupByRegion, type MarketLite } from "@/lib/markets";

const STATUS_PREFIX = "status:";

export function Filters({
  market,
  stage,
  status,
  sort,
  markets,
}: {
  market: string;
  stage: string;
  /** "all" | "none" (not reviewed) | Interested | Reviewing | Discarded */
  status: string;
  sort: string;
  markets: MarketLite[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const groups = groupByRegion(markets);

  /** Set/clear several params at once (null or "all" clears). */
  function setParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  // One dropdown holds either a stage or a review status, so picking one
  // clears the other.
  const stageOrStatus =
    status !== "all" ? `${STATUS_PREFIX}${status}` : stage;

  function onStageOrStatus(v: string) {
    if (v === "all") setParams({ stage: null, status: null });
    else if (v.startsWith(STATUS_PREFIX))
      setParams({ stage: null, status: v.slice(STATUS_PREFIX.length) });
    else setParams({ stage: v, status: null });
  }

  const hasFilters =
    market !== "all" ||
    stage !== "all" ||
    status !== "all" ||
    sort !== "newest";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={market} onValueChange={(v) => setParams({ market: v })}>
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

      <Select value={stageOrStatus} onValueChange={onStageOrStatus}>
        <SelectTrigger className="w-[200px]" size="sm">
          <SelectValue placeholder="Stage / status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages &amp; statuses</SelectItem>
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            {REVIEW_STATUSES.map((s) => (
              <SelectItem key={s} value={`${STATUS_PREFIX}${s}`}>
                <span className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${REVIEW_STATUS_DOT[s]}`}
                  />
                  {REVIEW_STATUS_LABELS[s]}
                </span>
              </SelectItem>
            ))}
            <SelectItem value={`${STATUS_PREFIX}none`}>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-300" />
                Not reviewed
              </span>
            </SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Stage</SelectLabel>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setParams({ sort: v })}>
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
