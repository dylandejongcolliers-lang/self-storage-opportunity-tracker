// Market helpers. Pure + client-safe (no DB access here).

export const REGION_PRESETS = [
  "West Coast",
  "Southwest",
  "Midwest",
  "Southeast",
  "Northeast",
  "National",
] as const;

/** A tasteful set of market colors (navy, evergreen, brass, steel, plum, clay…). */
export const MARKET_COLOR_PRESETS = [
  "#1c3a5e",
  "#3f6043",
  "#7a5a2c",
  "#5f83a8",
  "#6b4a7a",
  "#8a4b3a",
  "#2f6b6b",
  "#64748b",
];

export type MarketLite = {
  id: string;
  name: string;
  slug: string;
  region: string;
  states: string[];
  color: string;
  active: boolean;
  sortOrder: number;
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",
  colorado:"CO",connecticut:"CT",delaware:"DE",florida:"FL",georgia:"GA",
  hawaii:"HI",idaho:"ID",illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",
  kentucky:"KY",louisiana:"LA",maine:"ME",maryland:"MD",massachusetts:"MA",
  michigan:"MI",minnesota:"MN",mississippi:"MS",missouri:"MO",montana:"MT",
  nebraska:"NE",nevada:"NV","new hampshire":"NH","new jersey":"NJ",
  "new mexico":"NM","new york":"NY","north carolina":"NC","north dakota":"ND",
  ohio:"OH",oklahoma:"OK",oregon:"OR",pennsylvania:"PA","rhode island":"RI",
  "south carolina":"SC","south dakota":"SD",tennessee:"TN",texas:"TX",utah:"UT",
  vermont:"VT",virginia:"VA",washington:"WA","west virginia":"WV",
  wisconsin:"WI",wyoming:"WY","district of columbia":"DC",
};

/** Normalize "ca", "California", "CA " → "CA". Returns null if unrecognized. */
export function normalizeState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  const up = t.toUpperCase();
  if (STATE_CODES.has(up)) return up;
  const byName = STATE_NAME_TO_CODE[t.toLowerCase()];
  return byName ?? null;
}

/** Parse "CA, NV" or "CA NV" or "California, Nevada" into unique USPS codes. */
export function parseStates(raw: string): string[] {
  const tokens = raw
    .split(/[,;/|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const tok of tokens) {
    const code = normalizeState(tok);
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

/**
 * Resolve a market for a listing.
 *  - an explicit name/slug wins (case-insensitive, exact)
 *  - otherwise, if a state maps to exactly one active market, use it
 *  - otherwise null (the listing shows "Needs market assignment")
 */
export function matchMarket(
  markets: MarketLite[],
  opts: { name?: string | null; slug?: string | null; state?: string | null },
): MarketLite | null {
  const text = (opts.name ?? opts.slug ?? "").trim().toLowerCase();
  if (text) {
    const hit = markets.find(
      (m) => m.name.toLowerCase() === text || m.slug.toLowerCase() === text,
    );
    if (hit) return hit;
  }

  const st = normalizeState(opts.state);
  if (st) {
    const byState = markets.filter((m) => m.active && m.states.includes(st));
    if (byState.length === 1) return byState[0];
  }

  return null;
}

/** Group markets by region, regions ordered by each region's min sortOrder. */
export function groupByRegion(
  markets: MarketLite[],
): { region: string; markets: MarketLite[] }[] {
  const map = new Map<string, MarketLite[]>();
  for (const m of markets) {
    const key = m.region || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return [...map.entries()]
    .map(([region, list]) => ({
      region,
      markets: list.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    }))
    .sort(
      (a, b) =>
        Math.min(...a.markets.map((m) => m.sortOrder)) -
        Math.min(...b.markets.map((m) => m.sortOrder)),
    );
}
