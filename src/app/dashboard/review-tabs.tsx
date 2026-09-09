"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ReviewTabs({
  view,
  reviewCount,
}: {
  view: "all" | "review" | "board";
  reviewCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(next: "all" | "review") {
    const p = new URLSearchParams(params.toString());
    p.delete("board");
    if (next === "review") p.set("view", "review");
    else p.delete("view");
    const qs = p.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  const base =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const on = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200";
  const off = "text-slate-500 hover:text-slate-900";

  return (
    <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => go("all")}
        className={`${base} ${view === "all" ? on : off}`}
      >
        All listings
      </button>
      <button
        type="button"
        onClick={() => go("review")}
        className={`${base} ${view === "review" ? on : off}`}
      >
        Review queue
        {reviewCount > 0 ? (
          <span
            className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
              view === "review"
                ? "bg-amber-100 text-amber-800"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {reviewCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
