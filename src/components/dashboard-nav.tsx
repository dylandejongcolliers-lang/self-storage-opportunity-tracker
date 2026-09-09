"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/dashboard",
    label: "Listings",
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    match: (p: string) => p.startsWith("/dashboard/clients"),
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "relative rounded-md px-3 py-1.5 font-medium transition-colors " +
              (active
                ? "text-brand"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")
            }
          >
            {l.label}
            {active ? (
              <span className="bg-brand absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
