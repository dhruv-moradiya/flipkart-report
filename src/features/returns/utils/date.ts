/**
 * Date parsing and formatting utilities for Flipkart Reports
 */

export function parseFlipkartDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // Excel serial number (e.g. 45432)
  if (typeof val === "number") {
    if (val > 25000 && val < 60000) {
      // Excel epoch starts Dec 30 1899
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return isNaN(dateInfo.getTime()) ? null : dateInfo;
    }
  }

  if (typeof val === "string") {
    const str = val.trim();
    if (!str || str.toLowerCase() === "null" || str.toLowerCase() === "n/a") return null;

    // Direct ISO or standard parse
    const directDate = new Date(str);
    if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2000 && directDate.getFullYear() < 2100) {
      return directDate;
    }

    // Try DD-MM-YYYY or DD/MM/YYYY or DD-MM-YYYY HH:mm:ss
    const match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const minute = match[5] ? parseInt(match[5], 10) : 0;
      const second = match[6] ? parseInt(match[6], 10) : 0;

      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

export function toValidDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  return parseFlipkartDate(val);
}

export function formatDate(date: unknown, fallback = "-"): string {
  const d = toValidDate(date);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: unknown, fallback = "-"): string {
  const d = toValidDate(date);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatISODateOnly(date: unknown): string {
  const d = toValidDate(date);
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}
