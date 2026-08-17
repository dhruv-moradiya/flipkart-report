import * as XLSX from "xlsx";
import { ReportType, WorkbookDetectionResult, REPORT_TYPE_OPTIONS, OverallSummaryMetadata } from "../types/report.types";

function cleanName(str: string): string {
  return str.toLowerCase().replace(/[-_\s]+/g, "");
}

/**
 * Extracts metadata from the "Overall Summary" sheet if present
 */
export function extractOverallSummary(sheet: XLSX.WorkSheet): OverallSummaryMetadata | null {
  try {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    const metadata: Record<string, string> = {};

    rows.forEach((row) => {
      if (Array.isArray(row) && row.length >= 2) {
        const key = String(row[0] || "").trim();
        const val = String(row[1] || "").trim();
        if (key && val) {
          metadata[key] = val;
        }
      }
    });

    let reportType = metadata["Report Type:"] || metadata["Report Type"] || "";
    const ordersReceivedPeriod =
      metadata["Orders Received During:"] || metadata["Orders Received During"] || metadata["Period:"] || "";
    const generatedOn = metadata["Generated on:"] || metadata["Generated on"] || metadata["Date:"] || "";
    const sellerId = metadata["Seller ID:"] || metadata["Seller ID"] || metadata["Merchant ID:"] || "";

    if (reportType || ordersReceivedPeriod) {
      return {
        reportType: reportType || "Profit & Loss Report",
        ordersReceivedPeriod,
        generatedOn,
        sellerId,
        rawMetadata: metadata,
      };
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Analyzes workbook sheet names and headers to auto-detect report type
 */
export function detectReportType(workbook: XLSX.WorkBook): WorkbookDetectionResult {
  const sheetNames = workbook.SheetNames || [];

  if (sheetNames.length === 0) {
    return {
      detectedType: "unknown",
      confidence: "none",
      sheetNames: [],
      matchingSheets: [],
      suggestedOption: null,
      validationError: "Workbook does not contain any sheets.",
    };
  }

  // 1. Check for Overall Summary sheet
  const summarySheetName = sheetNames.find((name) => {
    const clean = cleanName(name);
    return clean.includes("overallsummary") || clean.includes("summary");
  });

  let overallSummaryMeta: OverallSummaryMetadata | null = null;
  if (summarySheetName && workbook.Sheets[summarySheetName]) {
    overallSummaryMeta = extractOverallSummary(workbook.Sheets[summarySheetName]);
  }

  // 2. Check for SKU-level P&L and Orders P&L sheets
  const hasSkuPnlSheet = sheetNames.some((name) => {
    const clean = cleanName(name);
    return clean.includes("skulevelpnl") || clean.includes("skupnl") || (clean.includes("sku") && clean.includes("pnl"));
  });

  const hasOrdersPnlSheet = sheetNames.some((name) => {
    const clean = cleanName(name);
    return clean.includes("orderspnl") || clean.includes("orderpnl") || (clean.includes("order") && clean.includes("pnl"));
  });

  const isPnlReport =
    (overallSummaryMeta && overallSummaryMeta.reportType.toLowerCase().includes("profit")) ||
    (hasSkuPnlSheet && hasOrdersPnlSheet) ||
    (summarySheetName && (hasSkuPnlSheet || hasOrdersPnlSheet));

  if (isPnlReport) {
    const matching: string[] = [];
    sheetNames.forEach((s) => {
      const clean = cleanName(s);
      if (clean.includes("summary") || clean.includes("pnl") || clean.includes("help")) {
        matching.push(s);
      }
    });

    return {
      detectedType: "profit_loss",
      confidence: hasSkuPnlSheet && hasOrdersPnlSheet ? "high" : "medium",
      sheetNames,
      matchingSheets: matching,
      suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "profit_loss") || null,
      overallSummary: overallSummaryMeta,
    };
  }

  // 3. Check for Returns report headers across first sheet
  const firstSheetName = sheetNames[0];
  const firstWs = workbook.Sheets[firstSheetName];
  if (firstWs) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstWs, { header: 1, defval: "" });
    const headerRow = rows[0] || [];
    const headerStrings = headerRow.map((h) => cleanName(String(h || "")));

    const hasReturnId = headerStrings.some((h) => h.includes("returnid"));
    const hasTrackingId = headerStrings.some((h) => h.includes("trackingid"));
    const hasReturnStatus = headerStrings.some((h) => h.includes("returnstatus"));
    const hasLocationId = headerStrings.some((h) => h.includes("locationid"));
    const hasOrderItemId = headerStrings.some((h) => h.includes("orderitemid") || h.includes("itemid"));

    if (hasReturnId || (hasTrackingId && hasReturnStatus) || (hasLocationId && hasReturnId) || (hasReturnId && hasOrderItemId)) {
      return {
        detectedType: "returns",
        confidence: "high",
        sheetNames,
        matchingSheets: [firstSheetName],
        suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "returns") || null,
      };
    }
  }

  // 4. Fallback
  return {
    detectedType: "unknown",
    confidence: "low",
    sheetNames,
    matchingSheets: [],
    suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "returns") || null,
  };
}
