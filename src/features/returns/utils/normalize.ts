/**
 * Normalization utilities for raw Flipkart report values
 */

export function normalizeString(val: unknown): string {
  if (val === null || val === undefined) return "";

  if (typeof val === "number") {
    if (isNaN(val)) return "";
    const str = val.toString();
    if (str.includes("e") || str.includes("E")) {
      return parseScientificNotation(str);
    }
    if (Math.abs(val) >= 1e10) {
      try {
        return BigInt(Math.round(val)).toString();
      } catch {
        return val.toLocaleString("fullwide", { useGrouping: false });
      }
    }
    return str;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d+(\.\d+)?e\+\d+$/i.test(trimmed)) {
      return parseScientificNotation(trimmed);
    }
    return trimmed;
  }

  return String(val).trim();
}

export function normalizeNullableString(val: unknown): string | null {
  const str = normalizeString(val);
  return str.length > 0 ? str : null;
}

export function normalizeNumber(val: unknown, defaultValue = 0): number {
  if (val === null || val === undefined) return defaultValue;
  if (typeof val === "number") return isNaN(val) ? defaultValue : val;

  const str = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

export function normalizeInteger(val: unknown, defaultValue = 0): number {
  if (val === null || val === undefined) return defaultValue;
  if (typeof val === "number") return isNaN(val) ? defaultValue : Math.round(val);

  const str = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}

function parseScientificNotation(str: string): string {
  try {
    const parts = str.toLowerCase().split("e+");
    if (parts.length === 2) {
      const mantissa = parts[0];
      const exponent = parseInt(parts[1], 10);
      if (!isNaN(exponent)) {
        const decimalIndex = mantissa.indexOf(".");
        if (decimalIndex === -1) {
          return mantissa + "0".repeat(exponent);
        }
        const digits = mantissa.replace(".", "");
        const decimalPlaces = mantissa.length - decimalIndex - 1;
        const zeroPadding = exponent - decimalPlaces;
        if (zeroPadding >= 0) {
          return digits + "0".repeat(zeroPadding);
        }
      }
    }
    const num = Number(str);
    if (!isNaN(num)) {
      return BigInt(Math.round(num)).toString();
    }
  } catch {
    // Return original string on fallback
  }
  return str;
}
