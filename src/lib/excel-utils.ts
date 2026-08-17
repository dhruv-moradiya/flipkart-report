import * as XLSX from "xlsx";
import { FileAnalysis, ParsedSheet, FlipkartReturnMetrics } from "@/types/excel";

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function isValidExcelFile(fileName: string): boolean {
  const validExtensions = [".xlsx", ".xls", ".csv"];
  const fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return validExtensions.includes(fileExtension);
}

/**
 * Formats any cell value into a clean, human-readable string.
 * Converts scientific notation strings (e.g. 1.2103499490156267e+25)
 * and large numbers/BigInts into full digit strings without truncation or scientific notation.
 */
export function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";

  // If it's a number
  if (typeof val === "number") {
    if (isNaN(val)) return "";

    // Handle large numbers or float representation of big integers
    if (Math.abs(val) >= 1e10 || val.toString().includes("e")) {
      const numStr = val.toString();
      if (numStr.includes("e") || numStr.includes("E")) {
        return parseScientificNotationString(numStr);
      }
      try {
        return BigInt(Math.round(val)).toString();
      } catch {
        return val.toLocaleString("fullwide", { useGrouping: false });
      }
    }
    return val.toString();
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return "";

    // Check if string is in scientific notation like 1.2103499490156267e+25 or 1.258e+25
    if (/^\d+(\.\d+)?e\+\d+$/i.test(trimmed)) {
      return parseScientificNotationString(trimmed);
    }
    return val;
  }

  if (typeof val === "boolean") {
    return val ? "True" : "False";
  }

  return String(val);
}

/**
 * Converts a scientific notation string like "1.2103499490156267e+25"
 * into a full numeric string: "12103499490156267000000000"
 */
function parseScientificNotationString(str: string): string {
  try {
    const parts = str.toLowerCase().split("e+");
    if (parts.length === 2) {
      const mantissa = parts[0];
      const exponent = parseInt(parts[1], 10);
      if (!isNaN(exponent)) {
        const decimalIndex = mantissa.indexOf(".");
        if (decimalIndex === -1) {
          return mantissa + "0".repeat(exponent);
        } else {
          const digits = mantissa.replace(".", "");
          const decimalPlaces = mantissa.length - decimalIndex - 1;
          const zeroPadding = exponent - decimalPlaces;
          if (zeroPadding >= 0) {
            return digits + "0".repeat(zeroPadding);
          } else {
            const splitPos = decimalIndex + exponent;
            return digits.slice(0, splitPos) + "." + digits.slice(splitPos);
          }
        }
      }
    }
    const num = Number(str);
    if (!isNaN(num)) {
      return BigInt(Math.round(num)).toString();
    }
  } catch {
    // Fallback to original string
  }
  return str;
}

export async function parseExcelFile(file: File): Promise<FileAnalysis> {
  const buffer = await file.arrayBuffer();
  // Read workbook with raw: false so SheetJS produces formatted cell text
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellDates: true,
    raw: false,
  });

  const parsedSheets: ParsedSheet[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Use raw: false so numbers formatted as text or strings preserve exact string text
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    // Format all cells to clean full strings (removing scientific notation)
    const fullData: Record<string, unknown>[] = rawData.map((row) => {
      const formattedRow: Record<string, unknown> = {};
      Object.keys(row).forEach((key) => {
        formattedRow[key] = formatCellValue(row[key]);
      });
      return formattedRow;
    });

    const rowCount = fullData.length;
    totalRows += rowCount;

    let headers: string[] = [];
    if (rowCount > 0 && fullData[0]) {
      headers = Object.keys(fullData[0]);
    }

    parsedSheets.push({
      name: sheetName,
      rowCount,
      headers,
      previewRows: fullData.slice(0, 5),
      fullData,
    });
  }

  const analysis: FileAnalysis = {
    fileName: file.name,
    fileSize: file.size,
    formattedSize: formatBytes(file.size),
    sheetNames: workbook.SheetNames,
    totalRows,
    sheets: parsedSheets,
    parsedAt: new Date().toISOString(),
  };

  return analysis;
}

/**
 * Calculates Flipkart Returns analytical metrics from parsed sheet rows
 */
export function calculateFlipkartReturnMetrics(sheet: ParsedSheet): FlipkartReturnMetrics {
  const rows = sheet.fullData;
  const headers = sheet.headers.map((h) => h.toLowerCase().trim());

  // Find column names dynamically
  const statusKey = sheet.headers.find((h) =>
    /status|return_status|return status|state|fulfillment status/i.test(h)
  );
  const typeKey = sheet.headers.find((h) =>
    /type|return_type|return type|sub_type|reason/i.test(h)
  );
  const amountKey = sheet.headers.find((h) =>
    /amount|refund|price|value|return_value|total_amount|item_price/i.test(h)
  );
  const reasonKey = sheet.headers.find((h) =>
    /reason|return_reason|return reason|comments|remarks/i.test(h)
  );
  const skuKey = sheet.headers.find((h) =>
    /sku|fsn|item_id|product_id|title|item_title|product_name|product/i.test(h)
  );

  let totalRefundValue = 0;
  let customerReturns = 0;
  let courierReturns = 0;

  const statusCounts: Record<string, number> = {};
  const reasonCounts: Record<string, number> = {};
  const skuCounts: Record<string, number> = {};

  rows.forEach((row) => {
    // Amount calculation
    if (amountKey && row[amountKey]) {
      const valStr = String(row[amountKey]).replace(/[^0-9.-]+/g, "");
      const val = parseFloat(valStr);
      if (!isNaN(val)) {
        totalRefundValue += val;
      }
    }

    // Status tracking
    if (statusKey && row[statusKey]) {
      const status = String(row[statusKey]).trim();
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    }

    // Type tracking (Customer vs Courier / RTO)
    if (typeKey && row[typeKey]) {
      const typeStr = String(row[typeKey]).toLowerCase();
      if (typeStr.includes("courier") || typeStr.includes("rto") || typeStr.includes("dispatched")) {
        courierReturns++;
      } else {
        customerReturns++;
      }
    } else {
      customerReturns++;
    }

    // Reason tracking
    if (reasonKey && row[reasonKey]) {
      const reason = String(row[reasonKey]).trim();
      if (reason) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }

    // SKU tracking
    if (skuKey && row[skuKey]) {
      const sku = String(row[skuKey]).trim();
      if (sku) {
        skuCounts[sku] = (skuCounts[sku] || 0) + 1;
      }
    }
  });

  // Top reasons sorted
  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top SKUs sorted
  const topSkus = Object.entries(skuCounts)
    .map(([sku, count]) => ({ sku, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalReturns: rows.length,
    totalRefundValue,
    customerReturns,
    courierReturns,
    statusCounts,
    topReasons,
    topSkus,
  };
}

export function logParsedDataToConsole(analysis: FileAnalysis): void {
  console.group(`📊 [Flipkart Reports] Parsed File: ${analysis.fileName}`);
  console.log("📁 File Metadata:", {
    name: analysis.fileName,
    sizeInBytes: analysis.fileSize,
    formattedSize: analysis.formattedSize,
    parsedAt: analysis.parsedAt,
    totalSheets: analysis.sheetNames.length,
    totalRows: analysis.totalRows,
  });

  const summaryMap: Record<string, { rowCount: number; columns: string[] }> = {};

  analysis.sheets.forEach((sheet) => {
    summaryMap[sheet.name] = {
      rowCount: sheet.rowCount,
      columns: sheet.headers,
    };

    console.group(`📄 Sheet "${sheet.name}" (${sheet.rowCount} rows)`);
    console.log(`Columns (${sheet.headers.length}):`, sheet.headers);
    console.log("Raw Data Array (Full Digits, No Scientific Notation):", sheet.fullData);
    console.table(sheet.fullData.slice(0, 100)); // Log table preview up to 100 rows
    console.groupEnd();
  });

  console.log("📈 Sheets Summary:", summaryMap);
  console.groupEnd();
}
