import * as XLSX from "xlsx";
import { colIndexToLetter } from "./workbook-reader";
import { resolveMergedHeaders } from "./merged-cells";
import { isColumnHidden } from "./hidden-columns";

export interface ResolvedColumn {
  index: number;
  excelLetter: string;
  parentHeader: string | null;
  childHeader: string | null;
  fullHeader: string;
  normalizedName: string;
  hidden: boolean;
  confidence: number;
}

export interface HeaderMatrixResult {
  columns: ResolvedColumn[];
  dataRows: unknown[][];
  headerRowCount: number;
  maxCols: number;
}

/**
 * Cleans string for resilient normalized matching (lowercase, no symbols/spaces)
 */
export function cleanHeaderString(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[-_\s():[\]/\\#.,%₹]+/g, "");
}

/**
 * Resolves multi-row headers and merged cells from an XLSX worksheet or raw matrix
 */
export function resolveWorksheetHeaders(
  worksheet: XLSX.WorkSheet,
  forcedHeaderRows?: number
): HeaderMatrixResult {
  // 1. Read sheet as 2D matrix of raw values
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (matrix.length === 0) {
    return { columns: [], dataRows: [], headerRowCount: 0, maxCols: 0 };
  }

  // 2. Identify maximum column length across sample rows
  let maxCols = 0;
  for (let i = 0; i < Math.min(matrix.length, 50); i++) {
    const row = matrix[i];
    if (Array.isArray(row) && row.length > maxCols) {
      maxCols = row.length;
    }
  }

  if (worksheet["!ref"]) {
    try {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      maxCols = Math.max(maxCols, range.e.c + 1);
    } catch {
      // Ignore
    }
  }

  // 3. Determine if Row 2 (index 1) is a child header row or data row
  let effectiveHeaderRowCount = forcedHeaderRows !== undefined ? forcedHeaderRows : 1;
  const merges = (worksheet["!merges"] || []) as XLSX.Range[];
  const cols = (worksheet["!cols"] || []) as XLSX.ColInfo[];

  if (forcedHeaderRows === undefined && matrix.length > 1 && Array.isArray(matrix[1])) {
    const hasRow0Merges = merges.some((m) => m.s.r === 0);
    const row1Sample = matrix[1];
    const headerKeywords = [
      "fee", "taxes", "rto", "rvp", "cancellation", "discount", "spf",
      "breakup", "tds", "gst", "tcs", "reason", "status", "neft",
      "commission", "fixed", "collection", "shipping", "storage", "recall",
      "units", "rate", "gross", "net", "amount", "date", "name", "id", "sku",
      "price", "sales", "earnings", "settled", "pending", "item", "product"
    ];

    let headerWordMatches = 0;
    let dataMatches = 0;

    row1Sample.forEach((val) => {
      if (val === null || val === undefined || val === "") return;
      if (typeof val === "number" || typeof val === "boolean" || val instanceof Date) {
        dataMatches++;
      } else {
        const str = String(val).trim().toLowerCase();
        if (str.startsWith("od") || /^\d{10,}$/.test(str)) {
          dataMatches++;
        } else if (headerKeywords.some((kw) => str.includes(kw))) {
          headerWordMatches++;
        }
      }
    });

    if (hasRow0Merges || (headerWordMatches >= 2 && headerWordMatches >= dataMatches)) {
      effectiveHeaderRowCount = 2;
    }
  }

  // 4. Extract raw header rows
  const rawRow0: (string | null)[] = new Array(maxCols).fill(null);
  const rawRow1: (string | null)[] = new Array(maxCols).fill(null);

  if (matrix[0] && Array.isArray(matrix[0])) {
    matrix[0].forEach((val, idx) => {
      if (val !== null && val !== undefined && String(val).trim()) {
        rawRow0[idx] = String(val).trim();
      }
    });
  }

  if (effectiveHeaderRowCount >= 2 && matrix[1] && Array.isArray(matrix[1])) {
    matrix[1].forEach((val, idx) => {
      if (val !== null && val !== undefined && String(val).trim()) {
        rawRow1[idx] = String(val).trim();
      }
    });
  }

  // 5. Propagate Merged Cells
  const { resolvedRow0, resolvedRow1 } = resolveMergedHeaders(rawRow0, rawRow1, merges, maxCols);

  // 6. Build ResolvedColumn structures
  const columns: ResolvedColumn[] = [];
  for (let c = 0; c < maxCols; c++) {
    const parentHeader = resolvedRow0[c] || null;
    const childHeader = effectiveHeaderRowCount >= 2 ? resolvedRow1[c] || null : null;

    let fullHeader = "";
    if (parentHeader && childHeader && parentHeader !== childHeader) {
      fullHeader = `${parentHeader} > ${childHeader}`;
    } else {
      fullHeader = childHeader || parentHeader || `Column_${colIndexToLetter(c)}`;
    }

    const hidden = isColumnHidden(cols, c);

    columns.push({
      index: c,
      excelLetter: colIndexToLetter(c),
      parentHeader,
      childHeader,
      fullHeader,
      normalizedName: cleanHeaderString(fullHeader),
      hidden,
      confidence: 1.0,
    });
  }

  // 7. Extract data rows
  const dataRows: unknown[][] = [];
  for (let r = effectiveHeaderRowCount; r < matrix.length; r++) {
    const row = matrix[r];
    if (Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
      dataRows.push(row);
    }
  }

  return {
    columns,
    dataRows,
    headerRowCount: effectiveHeaderRowCount,
    maxCols,
  };
}
