"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Debounced search box — filters listings by property name, address, city,
 *  state, market, source, broker contact, or internal notes. Narrows
 *  whatever view/filters are already active (review queue, a board, market,
 *  stage) rather than replacing them. */
export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";

  const [value, setValue] = useState(urlQ);
  // Tracks the URL value we've last reconciled against, so we can tell "the
  // URL changed underneath us" (e.g. the Filters "Clear" button) apart from
  // "our own debounced push just landed" — adjusted during render per
  // https://react.dev/learn/you-might-not-need-an-effect, not in an effect.
  const [syncedUrlQ, setSyncedUrlQ] = useState(urlQ);
  if (urlQ !== syncedUrlQ) {
    setSyncedUrlQ(urlQ);
    setValue(urlQ);
  }

  useEffect(() => {
    if (value === urlQ) return;
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      const qs = next.toString();
      router.push(qs ? `/dashboard?${qs}` : "/dashboard");
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional debounce, only re-run on value edits
  }, [value]);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m17 17-4-4" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search property, address, city, state, notes…"
        className="focus:border-brand focus:ring-brand/20 w-full rounded-md border border-slate-300 bg-white py-2 pr-8 pl-9 text-sm shadow-sm outline-none focus:ring-2 sm:w-96"
        aria-label="Search listings"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 5l10 10M15 5 5 15" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
