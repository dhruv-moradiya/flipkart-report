export type ParsedStatus = "parsed" | "missing" | "unmapped" | "invalid";

export interface ParsedValue<T> {
  value: T | null;
  status: ParsedStatus;
  raw?: unknown;
}

/**
 * Creates a parsed value object
 */
export function createParsedValue<T>(
  value: T | null,
  status: ParsedStatus,
  raw?: unknown
): ParsedValue<T> {
  return { value, status, raw };
}

/**
 * Safely parses financial numbers while strictly preserving negative values,
 * decimals, zero, and returning explicit unparsed/missing statuses.
 */
export function parseFinancialNumber(val: unknown): ParsedValue<number> {
  if (val === null || val === undefined || val === "") {
    return { value: null, status: "missing", raw: val };
  }

  if (typeof val === "number") {
    if (isNaN(val)) {
      return { value: null, status: "invalid", raw: val };
    }
    return { value: val, status: "parsed", raw: val };
  }

  const str = String(val)
    .trim()
    .replace(/,/g, "")
    .replace(/₹/g, "")
    .replace(/\s/g, "");

  if (!str) {
    return { value: null, status: "missing", raw: val };
  }

  // Handle accounting format with parentheses: "(196.50)" -> -196.50
  if (str.startsWith("(") && str.endsWith(")")) {
    const inner = str.slice(1, -1);
    const num = Number(inner);
    if (isNaN(num)) {
      return { value: null, status: "invalid", raw: val };
    }
    return { value: -Math.abs(num), status: "parsed", raw: val };
  }

  const num = Number(str);
  if (isNaN(num)) {
    return { value: null, status: "invalid", raw: val };
  }

  return { value: num, status: "parsed", raw: val };
}

/**
 * Helper to unwrap parsed number with a fallback if desired, without masking unparsed states
 */
export function getNumericValue(parsed: ParsedValue<number>, fallback = 0): number {
  if (parsed.status === "parsed" && parsed.value !== null) {
    return parsed.value;
  }
  return fallback;
}

/**
 * Safely parses integer quantities
 */
export function parseInteger(val: unknown): ParsedValue<number> {
  const numParsed = parseFinancialNumber(val);
  if (numParsed.status !== "parsed" || numParsed.value === null) {
    return numParsed;
  }
  return {
    value: Math.round(numParsed.value),
    status: "parsed",
    raw: val,
  };
}

/**
 * Safely parses string values
 */
export function parseString(val: unknown): ParsedValue<string> {
  if (val === null || val === undefined) {
    return { value: null, status: "missing", raw: val };
  }
  const str = String(val).trim();
  if (!str) {
    return { value: null, status: "missing", raw: val };
  }
  return { value: str, status: "parsed", raw: val };
}

/**
 * Formats financial amounts with INR symbol, preserving negative signs
 */
export function formatINR(val: number | null | undefined, placeholder = "—"): string {
  if (val === null || val === undefined) return placeholder;
  if (val === 0) return "₹0";

  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
  }).format(absVal);

  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}
