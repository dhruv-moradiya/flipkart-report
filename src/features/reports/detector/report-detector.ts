import * as XLSX from "xlsx";
import {
  ReportType,
  ReportDetectionResult,
  REPORT_TYPE_OPTIONS,
  OverallSummaryMetadata,
} from "../types/report.types";
import { CONFIDENCE_SCORES } from "./confidence";

function cleanName(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "n")
    .replace(/[-_\s():/\\.]+/g, "");
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
 * Multi-signal inspector for Flipkart workbooks
 */
export function detectReportType(workbook: XLSX.WorkBook): ReportDetectionResult {
  const sheetNames = workbook.SheetNames || [];

  if (sheetNames.length === 0) {
    return {
      type: "unknown",
      confidence: CONFIDENCE_SCORES.NONE,
      version: null,
      sheets: [],
      warnings: ["Workbook does not contain any sheets."],
      errors: ["Empty workbook."],
      suggestedOption: null,
    };
  }

  const warnings: string[] = [];
  const errors: string[] = [];

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
    return (
      clean.includes("skulevelpnl") ||
      clean.includes("skupnl") ||
      clean.includes("skulevel") ||
      (clean.includes("sku") && (clean.includes("pnl") || clean.includes("pl") || clean.includes("p&l")))
    );
  });

  const hasOrdersPnlSheet = sheetNames.some((name) => {
    const clean = cleanName(name);
    return (
      clean.includes("orderspnl") ||
      clean.includes("orderpnl") ||
      clean.includes("orders") ||
      (clean.includes("order") && (clean.includes("pnl") || clean.includes("pl") || clean.includes("p&l")))
    );
  });

  const hasReportHelpSheet = sheetNames.some((name) => {
    const clean = cleanName(name);
    return clean.includes("reporthelp") || clean.includes("help") || clean.includes("dictionary");
  });

  // Calculate P&L confidence score based on signals
  let pnlSignals = 0;
  if (summarySheetName) pnlSignals += 1.5;
  if (
    overallSummaryMeta &&
    (overallSummaryMeta.reportType.toLowerCase().includes("profit") ||
      overallSummaryMeta.reportType.toLowerCase().includes("loss") ||
      overallSummaryMeta.reportType.toLowerCase().includes("p&l"))
  ) {
    pnlSignals += 3;
  }
  if (hasSkuPnlSheet) pnlSignals += 2.5;
  if (hasOrdersPnlSheet) pnlSignals += 2.5;
  if (hasReportHelpSheet) pnlSignals += 1;

  if (pnlSignals >= 3.5 || (hasSkuPnlSheet && hasOrdersPnlSheet) || (overallSummaryMeta && (hasSkuPnlSheet || hasOrdersPnlSheet))) {
    const confidence = pnlSignals >= 6 ? 0.98 : pnlSignals >= 4 ? 0.90 : 0.75;
    return {
      type: "profit_loss",
      confidence,
      version: "v1",
      sheets: sheetNames,
      warnings,
      errors,
      suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "profit_loss") || null,
      overallSummary: overallSummaryMeta,
    };
  }

  // 3. Inspect sheets for Returns report headers
  for (const sheetName of sheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    if (rows.length === 0) continue;

    const headerRow = (rows[0] || []).map((h) => cleanName(String(h || "")));
    let returnSignals = 0;

    if (headerRow.some((h) => h.includes("returnid"))) returnSignals += 2;
    if (headerRow.some((h) => h.includes("trackingid"))) returnSignals += 2;
    if (headerRow.some((h) => h.includes("orderitemid") || h.includes("itemid"))) returnSignals += 1.5;
    if (headerRow.some((h) => h.includes("locationid") || h.includes("locationname"))) returnSignals += 1;
    if (headerRow.some((h) => h.includes("returnstatus") || h.includes("completionstatus"))) returnSignals += 1.5;
    if (headerRow.some((h) => h.includes("returnreason") || h.includes("returnsubreason"))) returnSignals += 1;
    if (headerRow.some((h) => h.includes("comments") || h.includes("comment"))) returnSignals += 1;
    if (headerRow.some((h) => h.includes("returntype"))) returnSignals += 1;

    if (returnSignals >= 3.5) {
      const confidence = returnSignals >= 8 ? 0.98 : returnSignals >= 5 ? 0.88 : 0.70;
      return {
        type: "returns",
        confidence,
        version: "v1",
        sheets: sheetNames,
        warnings,
        errors,
        suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "returns") || null,
      };
    }
  }

  // 4. Fallback unknown
  return {
    type: "unknown",
    confidence: CONFIDENCE_SCORES.LOW,
    version: null,
    sheets: sheetNames,
    warnings: ["Could not determine Flipkart report type with high confidence."],
    errors: [],
    suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "profit_loss") || null,
  };
}
