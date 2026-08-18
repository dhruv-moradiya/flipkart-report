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

    const reportType = metadata["Report Type:"] || metadata["Report Type"] || "";
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

  // 2. Check for SKU-level P&L and Orders P&L sheet names
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

  // 3. Inspect columns across ALL sheets for P&L Financial Headers
  let hasFinancialColumns = false;
  for (const sheetName of sheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    if (rows.length === 0) continue;

    // Check first 3 rows for headers
    for (let r = 0; r < Math.min(3, rows.length); r++) {
      const headerRow = (rows[r] || []).map((h) => cleanName(String(h || "")));
      if (
        headerRow.some(
          (h) =>
            h.includes("netearnings") ||
            h.includes("estimatednetsales") ||
            h.includes("accountednetsales") ||
            h.includes("totalexpenses") ||
            h.includes("fixedfee") ||
            h.includes("reverseshippingfee") ||
            h.includes("banksettlement") ||
            h.includes("amountpending") ||
            h.includes("amountsettled") ||
            h.includes("sellerprice") ||
            h.includes("grosssales")
        )
      ) {
        hasFinancialColumns = true;
        break;
      }
    }
    if (hasFinancialColumns) break;
  }

  // Calculate P&L confidence score based on signals
  let pnlSignals = 0;
  if (summarySheetName) pnlSignals += 2;
  if (
    overallSummaryMeta &&
    (overallSummaryMeta.reportType.toLowerCase().includes("profit") ||
      overallSummaryMeta.reportType.toLowerCase().includes("loss") ||
      overallSummaryMeta.reportType.toLowerCase().includes("p&l"))
  ) {
    pnlSignals += 4;
  }
  if (hasSkuPnlSheet) pnlSignals += 3;
  if (hasOrdersPnlSheet) pnlSignals += 3;
  if (hasFinancialColumns) pnlSignals += 5;
  if (hasReportHelpSheet) pnlSignals += 1;

  if (
    hasFinancialColumns ||
    pnlSignals >= 3.5 ||
    (hasSkuPnlSheet && hasOrdersPnlSheet) ||
    (overallSummaryMeta && (hasSkuPnlSheet || hasOrdersPnlSheet))
  ) {
    const confidence = pnlSignals >= 6 || hasFinancialColumns ? 0.98 : 0.85;
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

  // 4. Inspect sheets for Returns report headers (ONLY if no financial P&L headers exist)
  for (const sheetName of sheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    if (rows.length === 0) continue;

    const headerRow = (rows[0] || []).map((h) => cleanName(String(h || "")));
    let returnSignals = 0;

    if (headerRow.some((h) => h.includes("returnid"))) returnSignals += 3;
    if (headerRow.some((h) => h.includes("trackingid"))) returnSignals += 2;
    if (headerRow.some((h) => h.includes("comments") || h.includes("comment"))) returnSignals += 2;
    if (headerRow.some((h) => h.includes("locationid") || h.includes("locationname"))) returnSignals += 1;
    if (headerRow.some((h) => h.includes("completionstatus"))) returnSignals += 1;

    // Must have explicit returnId or trackingId to be classified as returns
    if (returnSignals >= 4 && (headerRow.some((h) => h.includes("returnid")) || headerRow.some((h) => h.includes("trackingid")))) {
      const confidence = returnSignals >= 6 ? 0.95 : 0.80;
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

  // 5. Default to profit_loss as primary system schema
  return {
    type: "profit_loss",
    confidence: 0.80,
    version: "v1",
    sheets: sheetNames,
    warnings: [],
    errors: [],
    suggestedOption: REPORT_TYPE_OPTIONS.find((o) => o.id === "profit_loss") || null,
  };
}
