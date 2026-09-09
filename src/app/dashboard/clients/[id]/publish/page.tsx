import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ClientShareView } from "@/components/client-share-view";
import { formatDate } from "@/lib/listings";
import { WEEK_STATUS_LABELS } from "@/lib/clients";
import { PublishButton } from "./publish-button";

export const metadata = { title: "Publish snapshot" };

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      matches: {
        where: { weekStatus: { not: "Passed" } },
        orderBy: [{ weekStatus: "asc" }, { matchedAt: "desc" }],
        include: { listing: { include: { market: true } } },
      },
    },
  });
  if (!client) notFound();

  const counts = { New: 0, Updated: 0, CarriedOver: 0 } as Record<string, number>;
  for (const m of client.matches) counts[m.weekStatus] += 1;
  const pendingCount = counts.New + counts.Updated;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/clients"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to clients
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Publish snapshot — {client.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {client.lastPublishedAt
              ? `Last published ${formatDate(client.lastPublishedAt)}`
              : "Never published"}
          </p>
        </div>
        <PublishButton clientId={client.id} pendingCount={pendingCount} />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-md border px-2.5 py-1">
          {client.matches.length} shown
        </span>
        <span className="rounded-md border px-2.5 py-1">
          {counts.New} {WEEK_STATUS_LABELS.New}
        </span>
        <span className="rounded-md border px-2.5 py-1">
          {counts.Updated} {WEEK_STATUS_LABELS.Updated}
        </span>
        <span className="rounded-md border px-2.5 py-1">
          {counts.CarriedOver} {WEEK_STATUS_LABELS.CarriedOver}
        </span>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">
          Preview — exactly what {client.name} sees at their share link:
        </p>
        <div className="overflow-hidden rounded-xl border">
          <ClientShareView
            clientName={client.name}
            matches={client.matches}
            updatedAt={client.lastPublishedAt}
          />
        </div>
      </div>
    </div>
  );
}
