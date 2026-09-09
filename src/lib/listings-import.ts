// Parse pasted spreadsheet rows or CSV text into Listing create-data.
// Pure functions — safe to unit test and to import from client components.

import {
  MARKETS,
  STAGES,
  ASSIGNEES,
  type Market,
  type Stage,
  type Assignee,
} from "@/lib/listings";

export type ListingImportData = {
  propertyName: string;
  address: string;
  market: Market;
  source: string;
  dateFirstSeen: Date;
  stage: Stage;
  askingPrice: number | null;
  unitCount: number | null;
  nrsf: number | null;
  capRate: number | null;
  listingLink: string | null;
  dealRoomLink: string | null;
  brokerContact: string | null;
  assignedTo: Assignee | null;
  internalNotes: string;
};

export type ParsedRow = {
  line: number; // 1-based data row number (header excluded)
  data?: ListingImportData;
  error?: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  headerFound: boolean;
  unknownHeaders: string[];
};

type FieldKey = keyof ListingImportData;

const HEADER_ALIASES: Record<string, FieldKey> = {
  propertyname: "propertyName",
  property: "propertyName",
  name: "propertyName",
  address: "address",
  market: "market",
  source: "source",
  datefirstseen: "dateFirstSeen",
  date: "dateFirstSeen",
  firstseen: "dateFirstSeen",
  stage: "stage",
  askingprice: "askingPrice",
  asking: "askingPrice",
  price: "askingPrice",
  unitcount: "unitCount",
  units: "unitCount",
  nrsf: "nrsf",
  netrentable: "nrsf",
  sf: "nrsf",
  sqft: "nrsf",
  caprate: "capRate",
  cap: "capRate",
  listinglink: "listingLink",
  listingurl: "listingLink",
  listing: "listingLink",
  dealroomlink: "dealRoomLink",
  dealroom: "dealRoomLink",
  dealroomurl: "dealRoomLink",
  brokercontact: "brokerContact",
  broker: "brokerContact",
  assignedto: "assignedTo",
  assigned: "assignedTo",
  owner: "assignedTo",
  internalnotes: "internalNotes",
  notes: "internalNotes",
};

export const TEMPLATE_HEADERS = [
  "propertyName",
  "address",
  "market",
  "source",
  "dateFirstSeen",
  "stage",
  "askingPrice",
  "unitCount",
  "nrsf",
  "capRate",
  "listingLink",
  "dealRoomLink",
  "brokerContact",
  "assignedTo",
  "internalNotes",
];

export const TEMPLATE_CSV =
  TEMPLATE_HEADERS.join(",") +
  "\n" +
  [
    "Example Storage",
    "123 Main St, San Jose, CA",
    "Bay Area",
    "LoopNet",
    "2026-09-01",
    "New",
    "4200000",
    "310",
    "48000",
    "6.25",
    "https://...",
    "https://...",
    "Jane Broker",
    "Dylan",
    "Off-market whisper",
  ].join(",") +
  "\n";

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Split one delimited line, honoring double-quoted fields. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes("\t")) return "\t";
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  if (semis > commas) return ";";
  return ",";
}

function num(raw: string): number | null {
  const cleaned = raw.replace(/[$,%\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(raw: string): number | null {
  const n = num(raw);
  return n == null ? null : Math.round(n);
}

function mapEnum<T extends string>(
  raw: string,
  allowed: readonly T[],
  extra: Record<string, T> = {},
): T | null {
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  const direct = allowed.find((a) => a.toLowerCase() === key);
  if (direct) return direct;
  return extra[key] ?? null;
}

function parseDateLoose(raw: string): Date {
  const s = raw.trim();
  let y: number | undefined;
  let m: number | undefined;
  let d: number | undefined;

  let mm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (mm) {
    y = +mm[1];
    m = +mm[2];
    d = +mm[3];
  } else {
    mm = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
    if (mm) {
      m = +mm[1];
      d = +mm[2];
      y = +mm[3];
      if (y < 100) y += 2000;
    }
  }

  if (y && m && d) {
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}

function toRecord(
  fields: FieldKey[],
  values: string[],
): Partial<Record<FieldKey, string>> {
  const rec: Partial<Record<FieldKey, string>> = {};
  fields.forEach((f, i) => {
    if (f) rec[f] = values[i] ?? "";
  });
  return rec;
}

function buildData(
  rec: Partial<Record<FieldKey, string>>,
): { data?: ListingImportData; error?: string } {
  const propertyName = (rec.propertyName ?? "").trim();
  if (!propertyName) return { error: "Missing property name" };

  return {
    data: {
      propertyName,
      address: (rec.address ?? "").trim(),
      market:
        mapEnum<Market>(rec.market ?? "", MARKETS, {
          bayarea: "BayArea",
          sfbayarea: "BayArea",
          sandiego: "SanDiego",
          reno: "RenoNorthernNV",
          northernnv: "RenoNorthernNV",
          nv: "RenoNorthernNV",
          nevada: "RenoNorthernNV",
        }) ?? "Other",
      source: (rec.source ?? "").trim(),
      dateFirstSeen: parseDateLoose(rec.dateFirstSeen ?? ""),
      stage:
        mapEnum<Stage>(rec.stage ?? "", STAGES, {
          teamreviewed: "TeamReviewed",
          reviewed: "TeamReviewed",
          underwritingoffer: "UnderwritingOffer",
          underwriting: "UnderwritingOffer",
          offer: "UnderwritingOffer",
        }) ?? "New",
      askingPrice: intOrNull(rec.askingPrice ?? ""),
      unitCount: intOrNull(rec.unitCount ?? ""),
      nrsf: intOrNull(rec.nrsf ?? ""),
      capRate: num(rec.capRate ?? ""),
      listingLink: (rec.listingLink ?? "").trim() || null,
      dealRoomLink: (rec.dealRoomLink ?? "").trim() || null,
      brokerContact: (rec.brokerContact ?? "").trim() || null,
      assignedTo: mapEnum<Assignee>(rec.assignedTo ?? "", ASSIGNEES),
      internalNotes: (rec.internalNotes ?? "").trim(),
    },
  };
}

export function parseListingsInput(text: string): ParseResult {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l, i) => l.trim().length > 0 || i === 0);

  if (lines.length === 0 || !lines[0].trim()) {
    return { rows: [], headerFound: false, unknownHeaders: [] };
  }

  const delim = detectDelimiter(lines[0]);
  const headerCells = splitLine(lines[0], delim);
  const fields: FieldKey[] = [];
  const unknownHeaders: string[] = [];
  for (const cell of headerCells) {
    const key = HEADER_ALIASES[normalizeHeader(cell)];
    if (key) {
      fields.push(key);
    } else {
      fields.push("" as FieldKey);
      if (cell.trim()) unknownHeaders.push(cell.trim());
    }
  }

  const headerFound = fields.some((f) => f === "propertyName");
  if (!headerFound) {
    return { rows: [], headerFound: false, unknownHeaders };
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delim);
    if (values.every((v) => v === "")) continue;

    // Trim trailing empties, then flag rows with more values than columns —
    // almost always an unquoted comma inside a field.
    const trimmed = [...values];
    while (trimmed.length > fields.length && trimmed.at(-1) === "") trimmed.pop();
    if (trimmed.length > fields.length) {
      rows.push({
        line: i,
        error: `Row has ${trimmed.length} values but ${fields.length} columns — check for an unquoted comma (or paste tab-separated / upload a .csv)`,
      });
      continue;
    }

    const built = buildData(toRecord(fields, trimmed));
    rows.push({ line: i, data: built.data, error: built.error });
  }

  return { rows, headerFound: true, unknownHeaders };
}
