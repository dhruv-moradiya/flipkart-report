import * as XLSX from "xlsx";

export interface RawWorksheetData {
  sheetName: string;
  rows: Record<string, unknown>[];
  headers: string[];
}

export interface RawWorkbookData {
  sheetNames: string[];
  sheets: Record<string, RawWorksheetData>;
}

/**
 * Reads an Excel or CSV file and extracts raw sheet rows with exact cell formatting
 */
export async function readWorkbook(file: File): Promise<RawWorkbookData> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellDates: true,
    raw: false, // Ensures numbers as text are not corrupted to scientific notation
  });

  const sheets: Record<string, RawWorksheetData> = {};

  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });

    let headers: string[] = [];
    if (rows.length > 0 && rows[0]) {
      headers = Object.keys(rows[0]);
    }

    sheets[sheetName] = {
      sheetName,
      rows,
      headers,
    };
  });

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
}
