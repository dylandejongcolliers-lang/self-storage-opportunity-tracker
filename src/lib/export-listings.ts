// Builds the Excel export of the listings on screen. Server-side only.

import ExcelJS from "exceljs";
import type { Listing } from "@prisma/client";
import { listingTitle } from "./listing-title";
import {
  REVIEW_STATUSES,
  isReviewStatus,
  type ReviewStatus,
} from "./listings";

export type ExportListing = Listing & {
  matches: { clientReaction: string | null; client: { name: string } }[];
};

const REACTION_LABEL: Record<string, string> = {
  ReviewFurther: "Review further",
  Maybe: "Maybe",
  NotInterested: "Not interested",
};
const STAGE_LABEL: Record<string, string> = {
  New: "New",
  TeamReviewed: "Team reviewed",
  UnderwritingOffer: "Underwriting / offer",
};

const FONT = "Arial";
const NAVY = "FF1C3A5E";
const base = { name: FONT, size: 10 };
const money = '$#,##0;($#,##0);"-"';

/** Row highlight colors — match the app (green / yellow / red). */
const ROW_TINT: Record<ReviewStatus, string> = {
  Interested: "FFD8F0E0",
  Reviewing: "FFFFF3C4",
  Discarded: "FFF9D6D5",
};

const COLUMNS: { header: string; width: number; right?: boolean }[] = [
  { header: "Deal", width: 48 },
  { header: "City", width: 16 },
  { header: "State", width: 7 },
  { header: "Status", width: 13 },
  { header: "Decision date", width: 13 },
  { header: "Reason", width: 30 },
  { header: "Owner", width: 9 },
  { header: "Asking price", width: 13, right: true },
  { header: "Cap rate", width: 9, right: true },
  { header: "Units", width: 8, right: true },
  { header: "NRSF", width: 11, right: true },
  { header: "Price / NRSF", width: 12, right: true },
  { header: "Price / unit", width: 12, right: true },
  { header: "In client buy boxes", width: 26 },
  { header: "Client reactions", width: 30 },
  { header: "App stage", width: 18 },
  { header: "Flagged", width: 8 },
  { header: "First seen", width: 12 },
  { header: "Source", width: 20 },
  { header: "Listing link", width: 12 },
  { header: "Broker contact", width: 34 },
  { header: "Internal notes", width: 50 },
];

function ratio(a: number | null, b: number | null): number | "" {
  return typeof a === "number" && typeof b === "number" && b > 0 ? a / b : "";
}

export async function buildListingsWorkbook(
  listings: ExportListing[],
  scope: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Self-Storage Opportunity Tracker";
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  const N = listings.length;
  const LAST = Math.max(N + 1, 2);
  const lastCol = COLUMNS.length;

  // ===== Listings =====
  const ws = wb.addWorksheet("Listings", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));

  const header = ws.getRow(1);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { ...base, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = {
      vertical: "middle",
      horizontal: c.right ? "right" : "left",
      wrapText: true,
    };
  });
  header.height = 30;

  listings.forEach((l, idx) => {
    const r = idx + 2;
    const status = isReviewStatus(l.reviewStatus) ? l.reviewStatus : null;
    const reacted = l.matches.filter((m) => m.clientReaction);
    const row = ws.getRow(r);

    row.values = [
      listingTitle({ propertyName: l.propertyName, address: l.address }),
      l.city ?? "",
      l.state ?? "",
      status,
      l.reviewedAt ?? null,
      l.reviewReason || null,
      l.assignedTo ?? "",
      l.askingPrice,
      l.capRate == null ? null : l.capRate / 100, // stored as a fraction
      l.unitCount,
      l.nrsf,
      null, // Price / NRSF (formula below)
      null, // Price / unit (formula below)
      l.matches.map((m) => m.client.name).join(", "),
      reacted
        .map((m) => `${m.client.name}: ${REACTION_LABEL[m.clientReaction!] ?? m.clientReaction}`)
        .join("; "),
      STAGE_LABEL[l.stage] ?? l.stage,
      l.flaggedForReview ? "Yes" : "",
      l.dateFirstSeen,
      l.source ?? "",
      null, // link (below)
      l.brokerContact ?? "",
      l.internalNotes ?? "",
    ];

    row.getCell(12).value = {
      formula: `IF(AND(ISNUMBER(H${r}),ISNUMBER(K${r}),K${r}>0),H${r}/K${r},"")`,
      result: ratio(l.askingPrice, l.nrsf),
    };
    row.getCell(13).value = {
      formula: `IF(AND(ISNUMBER(H${r}),ISNUMBER(J${r}),J${r}>0),H${r}/J${r},"")`,
      result: ratio(l.askingPrice, l.unitCount),
    };
    if (l.listingLink) {
      row.getCell(20).value = { text: "Open", hyperlink: l.listingLink };
    }

    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c);
      cell.font = { ...base };
      cell.alignment = {
        vertical: "top",
        horizontal: COLUMNS[c - 1].right ? "right" : "left",
        wrapText: false,
      };
    }
    row.getCell(20).font = {
      ...base,
      color: { argb: "FF0563C1" },
      underline: true,
    };
    row.getCell(5).numFmt = "m/d/yyyy";
    row.getCell(8).numFmt = money;
    row.getCell(9).numFmt = "0.00%";
    row.getCell(10).numFmt = "#,##0";
    row.getCell(11).numFmt = "#,##0";
    row.getCell(12).numFmt = '$#,##0.00;($#,##0.00);"-"';
    row.getCell(13).numFmt = money;
    row.getCell(18).numFmt = "m/d/yyyy";
  });

  // Whole-row highlight by status, same colors as the app.
  const ref = `A2:${String.fromCharCode(64 + lastCol)}${LAST}`;
  ws.addConditionalFormatting({
    ref,
    rules: REVIEW_STATUSES.map((s, i) => ({
      type: "expression" as const,
      formulae: [`$D2="${s}"`],
      priority: i + 1,
      style: {
        fill: {
          type: "pattern" as const,
          pattern: "solid" as const,
          bgColor: { argb: ROW_TINT[s] },
        },
      },
    })),
  });
  ws.autoFilter = {
    from: "A1",
    to: { row: LAST, column: lastCol },
  };

  // ===== Summary =====
  const sm = wb.addWorksheet("Summary");
  sm.columns = [{ width: 30 }, { width: 12 }, { width: 12 }];
  const rng = (col: string) => `Listings!$${col}$2:$${col}$${LAST}`;

  sm.getCell("A1").value = "Review summary";
  sm.getCell("A1").font = { name: FONT, size: 14, bold: true, color: { argb: NAVY } };
  sm.getCell("A2").value = `Scope: ${scope}`;
  sm.getCell("A3").value = `Exported ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT — a snapshot; it doesn't update itself.`;
  for (const c of ["A2", "A3"]) {
    sm.getCell(c).font = { ...base, italic: true, color: { argb: "FF666666" } };
  }

  const hdr = (addr: string, text: string) => {
    const cell = sm.getCell(addr);
    cell.value = text;
    cell.font = { ...base, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  };
  hdr("A5", "Status");
  hdr("B5", "Deals");
  hdr("C5", "% of total");

  const counts: Record<string, number> = {};
  for (const s of REVIEW_STATUSES) {
    counts[s] = listings.filter((l) => l.reviewStatus === s).length;
  }
  REVIEW_STATUSES.forEach((s, i) => {
    const r = 6 + i;
    sm.getCell(`A${r}`).value = s;
    sm.getCell(`B${r}`).value = {
      formula: `COUNTIF(${rng("D")},A${r})`,
      result: counts[s],
    };
    sm.getCell(`C${r}`).value = {
      formula: `IF($B$10=0,0,B${r}/$B$10)`,
      result: N ? counts[s] / N : 0,
    };
  });
  const reviewed = REVIEW_STATUSES.reduce((a, s) => a + counts[s], 0);
  sm.getCell("A9").value = "Not reviewed";
  sm.getCell("B9").value = {
    formula: `COUNTA(${rng("A")})-SUM(B6:B8)`,
    result: N - reviewed,
  };
  sm.getCell("C9").value = {
    formula: "IF($B$10=0,0,B9/$B$10)",
    result: N ? (N - reviewed) / N : 0,
  };
  sm.getCell("A10").value = "Total deals";
  sm.getCell("B10").value = { formula: "SUM(B6:B9)", result: N };
  sm.getCell("C10").value = { formula: "SUM(C6:C9)", result: N ? 1 : 0 };
  for (let r = 6; r <= 10; r++) {
    for (const c of ["A", "B", "C"]) {
      sm.getCell(`${c}${r}`).font = { ...base, bold: r === 10 };
    }
    sm.getCell(`B${r}`).numFmt = "#,##0";
    sm.getCell(`C${r}`).numFmt = "0.0%";
  }
  for (const c of ["A10", "B10", "C10"]) {
    sm.getCell(c).border = { top: { style: "thin" } };
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
