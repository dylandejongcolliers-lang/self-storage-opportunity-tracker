// Display title for a deal: "Store Name - Address". Pure + client-safe.
//
//  - Portfolios use their portfolio title as-is (they span several addresses).
//  - A listing with no distinct store name (its name is just the address, or
//    already contains the street address) shows just the address / name.
//  - Otherwise: "Store Name - Address".

const NUMBER_WORD = "one|two|three|four|five|six|seven|eight|nine|ten";

/** "Portfolio", "5 Properties", "4 Locations", "3-Site", "2-pack", "Two-Property"… */
const PORTFOLIO_RE = new RegExp(
  [
    "portfolio",
    `\\b(?:\\d+|${NUMBER_WORD})[\\s-]*(?:propert(?:y|ies)|locations?|sites?|facilit(?:y|ies)|packs?)\\b`,
    "\\bproperties\\b",
    "\\blocations\\b",
  ].join("|"),
  "i",
);

/** Words that make a name a real store name rather than an address. */
const STOREISH_RE =
  /\b(storage|store|stor|mini|self|warehouse|units?|park|center|centre|rv|boat|lock|space|vault|depot)\b/;

export function isPortfolioName(name: string): boolean {
  return PORTFOLIO_RE.test(name);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function listingTitle(l: {
  propertyName: string;
  address?: string | null;
}): string {
  const name = (l.propertyName ?? "").trim();
  const address = (l.address ?? "").trim();
  if (!address) return name;
  if (!name) return address;
  if (isPortfolioName(name)) return name;

  const n = norm(name);
  const a = norm(address);
  const street = norm(address.split(",")[0]);

  // The "name" is just the address (or its street line) — show the fuller one.
  if (n === a || n === street) return address;
  // The name already carries the street address (e.g. "810 Woodchuck Dr
  // Self Storage", "1764 Guenther Rd, Dayton OH") — don't repeat it.
  if (street && n.includes(street)) return name;
  // The address already contains the whole name.
  if (a.includes(n)) return address;
  // The "name" is really the same address written differently (starts with
  // the same house number and has no store-ish word in it).
  const nameNumber = n.match(/^\d+[a-z]?\b/)?.[0];
  const addressNumber = a.match(/^\d+[a-z]?\b/)?.[0];
  if (nameNumber && nameNumber === addressNumber && !STOREISH_RE.test(n)) {
    return address;
  }

  return `${name} - ${address}`;
}
