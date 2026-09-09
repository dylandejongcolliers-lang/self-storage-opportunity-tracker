import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientShareView } from "@/components/client-share-view";

// Always render fresh from the database; never cache a client's view.
export const dynamic = "force-dynamic";

async function getClient(token: string) {
  return prisma.client.findUnique({
    where: { shareToken: token },
    include: {
      matches: {
        where: { weekStatus: { not: "Passed" } },
        orderBy: [{ weekStatus: "asc" }, { matchedAt: "desc" }],
        include: { listing: { include: { market: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const client = await getClient(token);
  return {
    title: {
      absolute: client
        ? `Opportunities for ${client.name}`
        : "Self-Storage Opportunity Tracker",
    },
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClient(token);
  if (!client) notFound();

  return (
    <ClientShareView
      clientName={client.name}
      matches={client.matches}
      updatedAt={client.lastPublishedAt}
    />
  );
}
