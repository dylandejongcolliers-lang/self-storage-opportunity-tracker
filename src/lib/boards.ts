// Shared client-board types. Safe to import from client components.

export type BoardLite = {
  id: string;
  name: string;
  count: number;
  clientId: string | null;
  clientName: string | null;
};
