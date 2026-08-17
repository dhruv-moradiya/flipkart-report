import * as XLSX from "xlsx";

export interface SheetMatrixData {
  sheetName: string;
  matrix: unknown[][];
  maxCols: number;
  rowCount: number;
  merges: XLSX.Range[];
  cols: XLSX.ColInfo[];
  ref: string | null;
}

export interface ReadWorkbookResult {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
  sheets: Record<string, SheetMatrixData>;
  fileSize: number;
  fileName: string;
}

/**
 * Reads workbook file buffer as a raw matrix structure with metadata
 */
export async function readWorkbookMatrix(file: File): Promise<ReadWorkbookResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellDates: true,
    raw: true,
  });

  const sheetNames = workbook.SheetNames || [];
  const sheets: Record<string, SheetMatrixData> = {};

  sheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

    // Read sheet as 2D raw array
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: null,
    });

    let maxCols = 0;
    for (let i = 0; i < Math.min(matrix.length, 100); i++) {
      const row = matrix[i];
      if (Array.isArray(row) && row.length > maxCols) {
        maxCols = row.length;
      }
    }

    if (ws["!ref"]) {
      try {
        const decoded = XLSX.utils.decode_range(ws["!ref"]);
        maxCols = Math.max(maxCols, decoded.e.c + 1);
      } catch {
        // Ignore range decode errors
      }
    }

    sheets[sheetName] = {
      sheetName,
      matrix,
      maxCols,
      rowCount: matrix.length,
      merges: ws["!merges"] || [],
      cols: (ws["!cols"] || []) as XLSX.ColInfo[],
      ref: ws["!ref"] || null,
    };
  });

  return {
    workbook,
    sheetNames,
    sheets,
    fileSize: file.size,
    fileName: file.name,
  };
}

/**
 * Converts column index to Excel column letter (0 -> A, 26 -> AA, etc.)
 */
export function colIndexToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
