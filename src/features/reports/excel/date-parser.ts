import { ParsedValue } from "./value-parser";

/**
 * Parses dates from various formats (Excel serial number, Date instance, ISO, DD/MM/YYYY, DD-MM-YYYY)
 */
export function parseDate(val: unknown): ParsedValue<Date> {
  if (val === null || val === undefined || val === "") {
    return { value: null, status: "missing", raw: val };
  }

  // Already a Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { value: null, status: "invalid", raw: val };
    }
    return { value: val, status: "parsed", raw: val };
  }

  // Excel serial number (e.g. 45290 -> date in 2023/2024)
  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) {
      return { value: null, status: "invalid", raw: val };
    }
    // Excel base date is Dec 30, 1899 due to 1900 leap year bug
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) {
      return { value: null, status: "invalid", raw: val };
    }
    return { value: date, status: "parsed", raw: val };
  }

  const str = String(val).trim();
  if (!str) {
    return { value: null, status: "missing", raw: val };
  }

  // 1. Try ISO string / standard JS date parser
  const parsedDirect = new Date(str);
  if (!isNaN(parsedDirect.getTime()) && !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(str)) {
    return { value: parsedDirect, status: "parsed", raw: val };
  }

  // 2. Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    const parsedDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    if (!isNaN(parsedDate.getTime()) && parsedDate.getUTCDate() === day) {
      return { value: parsedDate, status: "parsed", raw: val };
    }
  }

  // 3. Try YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);

    const parsedDate = new Date(Date.UTC(year, month, day));
    if (!isNaN(parsedDate.getTime())) {
      return { value: parsedDate, status: "parsed", raw: val };
    }
  }

  return { value: null, status: "invalid", raw: val };
}

/**
 * Formats a Date object or string as DD MMM YYYY (e.g. "02 Jul 2026")
 */
export function formatDate(date: Date | string | null | undefined, fallback = "—"): string {
  if (!date) return fallback;
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fallback;
  }
}
