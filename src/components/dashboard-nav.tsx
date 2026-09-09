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
    <nav className="flex h-16 items-stretch gap-6 text-sm">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "-mb-px flex items-center border-b-2 font-medium transition-colors " +
              (active
                ? "border-brand text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
