// Small helpers for reading values out of a submitted FormData.

export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function optionalStr(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v.length ? v : null;
}

export function optionalInt(formData: FormData, key: string): number | null {
  const raw = str(formData, key).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function optionalFloat(formData: FormData, key: string): number | null {
  const raw = str(formData, key).replace(/[%,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Turn a "YYYY-MM-DD" value from <input type="date"> into a Date fixed at
 * 12:00 UTC on that calendar day. Anchoring to noon UTC keeps the date from
 * sliding a day when it's later formatted in a timezone up to 12h off UTC.
 * Falls back to today (also at noon UTC) when empty/invalid.
 */
export function parseDateOnly(raw: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12));
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}
