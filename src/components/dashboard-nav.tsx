"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Listings", match: (p: string) => p === "/dashboard" },
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
              active
                ? "rounded-md bg-white/15 px-3 py-1.5 font-medium text-white"
                : "rounded-md px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
