"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STAGE_LABELS, formatMoney, type Stage } from "@/lib/listings";
import { matchMarket, type MarketLite } from "@/lib/markets";
import {
  parseListingsInput,
  TEMPLATE_CSV,
  TEMPLATE_HEADERS,
  type ParsedRow,
} from "@/lib/listings-import";
import { createListingsBulk } from "./actions";

type Step = "input" | "preview";

export function BulkAddDialog({ markets }: { markets: MarketLite[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseNote, setParseNote] = useState<string>();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = rows.filter((r) => r.data);
  const skipped = rows.filter((r) => !r.data);

  function reset() {
    setStep("input");
    setText("");
    setRows([]);
    setParseNote(undefined);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTimeout(reset, 150);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function doParse() {
    const res = parseListingsInput(text);
    if (!res.headerFound) {
      setParseNote(
        "Couldn't find a header row. The first row must name the columns and include at least “propertyName” (or “Property”).",
      );
      return;
    }
    if (res.rows.length === 0) {
      setParseNote("No data rows found under the header.");
      return;
    }
    setParseNote(
      res.unknownHeaders.length
        ? `Ignored unrecognized column(s): ${res.unknownHeaders.join(", ")}`
        : undefined,
    );
    setRows(res.rows);
    setStep("preview");
  }

  function marketNameFor(r: ParsedRow): string {
    if (!r.data) return "—";
    const hit = matchMarket(markets, {
      name: r.data.marketRaw,
      slug: r.data.marketRaw,
      state: r.data.state,
    });
    return hit ? hit.name : "Needs assignment";
  }

  function doImport() {
    startTransition(async () => {
      const res = await createListingsBulk(ready.map((r) => r.data!));
      if (!res.ok) {
        toast.error(res.error ?? "Import failed.");
        return;
      }
      toast.success(
        res.needsMarket > 0
          ? `Imported ${res.count} — ${res.needsMarket} need a market assigned.`
          : `Imported ${res.count} ${res.count === 1 ? "listing" : "listings"}.`,
      );
      handleOpenChange(false);
      router.refresh();
    });
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "listings-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Bulk add</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk add listings</DialogTitle>
          <DialogDescription>
            Paste rows from a spreadsheet or upload a CSV. The first row must be
            column headers.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Upload CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv"
                className="hidden"
                onChange={onFile}
              />
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-brand underline underline-offset-2"
              >
                Download template
              </button>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder={
                TEMPLATE_HEADERS.join(",") +
                "\nSunrise Storage,123 Main St,San Jose,CA,Bay Area,LoopNet,2026-09-01,New,4200000,310,48000,6.25,,,,Dylan,"
              }
              className="font-mono text-xs"
            />

            <p className="text-muted-foreground text-xs">
              Recognized columns: {TEMPLATE_HEADERS.join(", ")}. Only{" "}
              <span className="font-medium">propertyName</span> is required;
              anything else can be blank. <span className="font-medium">market</span>{" "}
              matches a market name or slug; leave it blank and set{" "}
              <span className="font-medium">state</span> to auto-assign. Stage
              accepts friendly names (&ldquo;Underwriting / Offer&rdquo;).
            </p>

            {parseNote ? (
              <p className="text-destructive text-sm">{parseNote}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={doParse} disabled={!text.trim()}>
                Preview
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-md border px-2.5 py-1">
                {rows.length} rows
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {ready.length} ready
              </span>
              {skipped.length > 0 ? (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700">
                  {skipped.length} skipped
                </span>
              ) : null}
            </div>

            {parseNote ? (
              <p className="text-muted-foreground text-xs">{parseNote}</p>
            ) : null}

            <div className="max-h-[45vh] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Property</th>
                    <th className="px-3 py-2 text-left font-medium">Market</th>
                    <th className="px-3 py-2 text-left font-medium">Stage</th>
                    <th className="px-3 py-2 text-right font-medium">Asking</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className="border-t">
                      <td className="text-muted-foreground px-3 py-1.5">
                        {r.line}
                      </td>
                      <td className="px-3 py-1.5">
                        {r.data?.propertyName ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className={
                            r.data && marketNameFor(r) === "Needs assignment"
                              ? "text-amber-700"
                              : ""
                          }
                        >
                          {marketNameFor(r)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        {r.data ? STAGE_LABELS[r.data.stage as Stage] : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {r.data ? formatMoney(r.data.askingPrice) : "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        {r.data ? (
                          <span className="text-emerald-600">Ready</span>
                        ) : (
                          <span className="text-rose-600">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("input")}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={doImport}
                disabled={pending || ready.length === 0}
              >
                {pending
                  ? "Importing…"
                  : `Import ${ready.length} ${ready.length === 1 ? "listing" : "listings"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
