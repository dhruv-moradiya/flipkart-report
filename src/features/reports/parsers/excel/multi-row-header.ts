import * as XLSX from "xlsx";

export interface ExcelColumnDefinition {
  index: number;
  letter: string;
  parentHeader: string | null;
  childHeader: string | null;
  combinedHeader: string;
  normalizedKey: string;
  hidden: boolean;
}

export interface MultiRowHeaderMatrix {
  columns: ExcelColumnDefinition[];
  dataRows: unknown[][];
  headerRowCount: number;
}

/**
 * Converts 0-indexed column number to Excel column letter (e.g. 0 -> A, 26 -> AA, 33 -> AH)
 */
export function colToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Cleans string for resilient fuzzy matching
 */
export function cleanHeaderString(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[-_\s():[\]/\\#.]+/g, "");
}

/**
 * Parses multi-level headers and merged cells from an XLSX worksheet
 */
export function parseMultiRowHeaderSheet(worksheet: XLSX.WorkSheet, headerRowCount = 2): MultiRowHeaderMatrix {
  // 1. Read sheet as 2D matrix of raw values
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (matrix.length === 0) {
    return { columns: [], dataRows: [], headerRowCount: 0 };
  }

  // 2. Identify maximum column length across all rows
  let maxCols = 0;
  for (let i = 0; i < Math.min(matrix.length, 50); i++) {
    const row = matrix[i];
    if (Array.isArray(row) && row.length > maxCols) {
      maxCols = row.length;
    }
  }

  // Also check worksheet range ref if available
  if (worksheet["!ref"]) {
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    maxCols = Math.max(maxCols, range.e.c + 1);
  }

  // 3. Intelligently determine if Row 2 (index 1) is a child header row or a data row
  let effectiveHeaderRowCount = 1;
  const merges = worksheet["!merges"] || [];
  const hasRow0Merges = merges.some((m) => m.s.r === 0);

  if (matrix.length > 1 && Array.isArray(matrix[1])) {
    const row1Sample = matrix[1];
    const headerKeywords = [
      "fee", "taxes", "rto", "rvp", "cancellation", "discount", "spf",
      "breakup", "tds", "gst", "tcs", "reason", "status", "neft",
      "commission", "fixed", "collection", "shipping", "storage", "recall",
      "units", "rate", "gross", "net", "amount", "date", "name", "id", "sku"
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

  // 4. Extract header rows
  const row0: (string | null)[] = new Array(maxCols).fill(null);
  const row1: (string | null)[] = new Array(maxCols).fill(null);

  if (matrix[0] && Array.isArray(matrix[0])) {
    matrix[0].forEach((val, idx) => {
      if (val !== null && val !== undefined && String(val).trim()) {
        row0[idx] = String(val).trim();
      }
    });
  }

  if (effectiveHeaderRowCount >= 2 && matrix[1] && Array.isArray(matrix[1])) {
    matrix[1].forEach((val, idx) => {
      if (val !== null && val !== undefined && String(val).trim()) {
        row1[idx] = String(val).trim();
      }
    });
  }

  // 5. Resolve Merged Cell Ranges (!merges)
  merges.forEach((merge) => {
    const { s, e } = merge;
    // Row 0 merge spanning across columns (e.g. O1:AH1 -> s.r=0, e.r=0, s.c=14, e.c=33)
    if (s.r === 0) {
      const parentVal = row0[s.c];
      if (parentVal) {
        for (let c = s.c; c <= e.c && c < maxCols; c++) {
          row0[c] = parentVal;
        }
      }
    }

    // Single column spanning row 0 to row 1 (e.g. A1:A2)
    if (s.r === 0 && e.r >= 1 && s.c === e.c) {
      const topVal = row0[s.c];
      if (topVal && !row1[s.c]) {
        row1[s.c] = topVal;
      }
    }
  });

  // 5. Check column visibility from !cols metadata
  const colsMeta = worksheet["!cols"] || [];

  // 6. Build ExcelColumnDefinition array
  const columns: ExcelColumnDefinition[] = [];
  for (let c = 0; c < maxCols; c++) {
    const pHeader = row0[c] || null;
    const cHeader = row1[c] || null;

    // Determine final effective title
    let combinedHeader = "";
    if (pHeader && cHeader && pHeader !== cHeader) {
      combinedHeader = `${pHeader} / ${cHeader}`;
    } else {
      combinedHeader = cHeader || pHeader || `Column_${colToLetter(c)}`;
    }

    const colMeta = colsMeta[c];
    const isHidden = Boolean(colMeta && (colMeta.hidden || colMeta.wch === 0));

    columns.push({
      index: c,
      letter: colToLetter(c),
      parentHeader: pHeader,
      childHeader: cHeader,
      combinedHeader,
      normalizedKey: cleanHeaderString(combinedHeader),
      hidden: isHidden,
    });
  }

  // 7. Extract data rows (rows after effectiveHeaderRowCount)
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
  };
}

/**
 * Creates a fast value getter for a specific row by matching aliases against multi-level column definitions
 */
export function createRowGetter(columns: ExcelColumnDefinition[]) {
  // Build lookup index of cleaned keys -> column indices
  const lookup = new Map<string, number>();

  columns.forEach((col) => {
    // 1. Match combined header (e.g. "Total Expenses (Breakup) / Commission Fee")
    if (col.combinedHeader) {
      lookup.set(cleanHeaderString(col.combinedHeader), col.index);
    }
    // 2. Match child header (e.g. "Commission Fee")
    if (col.childHeader) {
      lookup.set(cleanHeaderString(col.childHeader), col.index);
    }
    // 3. Match parent header (e.g. "Total Expenses (INR)")
    if (col.parentHeader && !lookup.has(cleanHeaderString(col.parentHeader))) {
      lookup.set(cleanHeaderString(col.parentHeader), col.index);
    }
  });

  return {
    getValue: (row: unknown[], aliases: string[]): unknown => {
      for (const alias of aliases) {
        const clean = cleanHeaderString(alias);
        const colIdx = lookup.get(clean);
        if (colIdx !== undefined && colIdx < row.length) {
          const val = row[colIdx];
          if (val !== undefined && val !== null && val !== "") {
            return val;
          }
        }
      }
      return undefined;
    },
    getColumnIndex: (aliases: string[]): number | null => {
      for (const alias of aliases) {
        const clean = cleanHeaderString(alias);
        const colIdx = lookup.get(clean);
        if (colIdx !== undefined) return colIdx;
      }
      return null;
    },
    hasColumn: (aliases: string[]): boolean => {
      for (const alias of aliases) {
        const clean = cleanHeaderString(alias);
        if (lookup.has(clean)) return true;
      }
      return false;
    },
  };
}
