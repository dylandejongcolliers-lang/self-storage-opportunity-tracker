"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Downloads the listings currently on screen (same view, filters, search and
 *  sort) as an Excel file. It's a plain link to the export route, so the
 *  browser handles the download. */
export function ExportButton() {
  const params = useSearchParams();
  const qs = params.toString();
  return (
    <Button variant="outline" asChild>
      <a
        href={qs ? `/dashboard/export?${qs}` : "/dashboard/export"}
        download
      >
        Export
      </a>
    </Button>
  );
}
