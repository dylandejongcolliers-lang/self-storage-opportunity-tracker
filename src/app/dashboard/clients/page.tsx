import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { listingMatchesBuyBox } from "@/lib/clients";
import { AddClientDialog } from "./add-client-dialog";
import { ClientCard } from "./client-card";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireAuth();

  const [clients, listings] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        matches: {
          orderBy: { matchedAt: "desc" },
          include: { listing: true },
        },
      },
    }),
    prisma.listing.findMany({ orderBy: { dateFirstSeen: "desc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <AddClientDialog />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-900">No clients yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a client and set their buy box to start matching listings.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {clients.map((client) => {
            const matchedListingIds = new Set(
              client.matches.map((m) => m.listingId),
            );
            const suggestions = listings.filter(
              (l) =>
                !matchedListingIds.has(l.id) &&
                listingMatchesBuyBox(l, client),
            );
            return (
              <ClientCard
                key={client.id}
                client={client}
                matches={client.matches}
                suggestions={suggestions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
