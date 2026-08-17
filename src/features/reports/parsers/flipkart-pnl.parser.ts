import * as XLSX from "xlsx";
import {
  SkuPnlRecord,
  OrderPnlRecord,
  PnlReport,
  ExpenseBreakdown,
  SettlementTransaction,
  PnlParserDiagnostics,
} from "../models/pnl.models";
import { extractOverallSummary } from "../detector/report-detector";
import { resolveWorksheetHeaders, cleanHeaderString } from "../excel/header-resolver";
import { matchColumnsToSchema, createRowAccessor } from "../excel/column-matcher";
import { PNL_V1_SKU_FIELDS, PNL_V1_ORDERS_FIELDS } from "../schemas/flipkart/versions/pnl.v1";
import { validateColumnMapping } from "../validation/schema-validator";
import { validateSkuFinancials, validateOrdersFinancials } from "../validation/financial-validator";
import { getNumericValue, parseFinancialNumber, parseString } from "../excel/value-parser";

/**
 * Finds sheet by fuzzy name matching
 */
export function findSheetByName(
  workbook: XLSX.WorkBook,
  patterns: string[]
): { name: string; sheet: XLSX.WorkSheet } | null {
  for (const name of workbook.SheetNames) {
    const clean = cleanHeaderString(name);
    for (const pattern of patterns) {
      if (clean.includes(cleanHeaderString(pattern))) {
        const sheet = workbook.Sheets[name];
        if (sheet) return { name, sheet };
      }
    }
  }
  return null;
}

/**
 * Parses the SKU-level P&L sheet using matrix ingestion and column matching
 */
export function parseSkuPnlSheet(sheet: XLSX.WorkSheet): {
  records: SkuPnlRecord[];
  columnsCount: number;
  hiddenCount: number;
  mappedKeys: string[];
  unknownKeys: string[];
  warnings: string[];
  errors: string[];
} {
  const headerMatrix = resolveWorksheetHeaders(sheet);
  const mapping = matchColumnsToSchema(headerMatrix.columns, PNL_V1_SKU_FIELDS, headerMatrix.dataRows);
  const validation = validateColumnMapping(mapping);
  const accessor = createRowAccessor(mapping, PNL_V1_SKU_FIELDS);

  const records: SkuPnlRecord[] = [];

  headerMatrix.dataRows.forEach((row, rowIdx) => {
    const skuParsed = accessor.getString(row, "sku");
    const sku = skuParsed.value;
    if (!sku) return;

    // Units
    const grossUnits = getNumericValue(accessor.getInteger(row, "grossUnits"), 0);
    const returnedCancelledUnits = getNumericValue(accessor.getInteger(row, "returnedCancelledUnits"), 0);
    const rtoUnits = getNumericValue(accessor.getInteger(row, "rtoUnits"), 0);
    const rvpUnits = getNumericValue(accessor.getInteger(row, "rvpUnits"), 0);
    const cancelledUnits = getNumericValue(accessor.getInteger(row, "cancelledUnits"), 0);
    const netUnits = getNumericValue(
      accessor.getInteger(row, "netUnits"),
      grossUnits - (returnedCancelledUnits || rtoUnits + rvpUnits + cancelledUnits)
    );

    // Sales
    const estimatedNetSales = getNumericValue(accessor.getNumber(row, "estimatedNetSales"), 0);
    const orderItemValue = getNumericValue(accessor.getNumber(row, "orderItemValue"), 0);
    const accountedNetSales = getNumericValue(accessor.getNumber(row, "accountedNetSales"), estimatedNetSales);

    // Total Expenses
    const totalExpenses = getNumericValue(accessor.getNumber(row, "totalExpenses"), 0);

    // Expenses Breakdown (Preserves negative signs)
    const commissionFee = getNumericValue(accessor.getNumber(row, "commissionFee"), 0);
    const collectionFee = getNumericValue(accessor.getNumber(row, "collectionFee"), 0);
    const fixedFee = getNumericValue(accessor.getNumber(row, "fixedFee"), 0);
    const pickAndPackFee = getNumericValue(accessor.getNumber(row, "pickAndPackFee"), 0);
    const forwardShippingFee = getNumericValue(accessor.getNumber(row, "forwardShippingFee"), 0);
    const reverseShippingFee = getNumericValue(accessor.getNumber(row, "reverseShippingFee"), 0);
    const storageFee = getNumericValue(accessor.getNumber(row, "storageFee"), 0);
    const recallFee = getNumericValue(accessor.getNumber(row, "recallFee"), 0);
    const productCancellationFee = getNumericValue(accessor.getNumber(row, "productCancellationFee"), 0);
    const offerAdjustments = getNumericValue(accessor.getNumber(row, "offerAdjustments"), 0);
    const noCostEmiFeeReimbursement = getNumericValue(accessor.getNumber(row, "noCostEmiFeeReimbursement"), 0);
    const installationFee = getNumericValue(accessor.getNumber(row, "installationFee"), 0);
    const techVisitFee = getNumericValue(accessor.getNumber(row, "techVisitFee"), 0);
    const uninstallationPackagingFee = getNumericValue(accessor.getNumber(row, "uninstallationPackagingFee"), 0);
    const customerAddonsRecovery = getNumericValue(accessor.getNumber(row, "customerAddonsRecovery"), 0);
    const franchiseFee = getNumericValue(accessor.getNumber(row, "franchiseFee"), 0);
    const shopsyMarketingFee = getNumericValue(accessor.getNumber(row, "shopsyMarketingFee"), 0);

    const taxesGst = getNumericValue(accessor.getNumber(row, "taxesGst"), 0);
    const taxesTcs = getNumericValue(accessor.getNumber(row, "taxesTcs"), 0);
    const taxesTds = getNumericValue(accessor.getNumber(row, "taxesTds"), 0);

    const expenses: ExpenseBreakdown = {
      commissionFee,
      collectionFee,
      fixedFee,
      pickAndPackFee,
      forwardShippingFee,
      offerAdjustments,
      reverseShippingFee,
      storageFee,
      recallFee,
      noCostEmiFeeReimbursement,
      installationFee,
      techVisitFee,
      uninstallationPackagingFee,
      customerAddonsRecovery,
      franchiseFee,
      shopsyMarketingFee,
      productCancellationFee,
      gst: taxesGst,
      tcs: taxesTcs,
      tds: taxesTds,
    };

    // Benefits
    const rewards = getNumericValue(accessor.getNumber(row, "rewards"), 0);
    const orderSpf = getNumericValue(accessor.getNumber(row, "orderSpf"), 0);
    const nonOrderSpf = getNumericValue(accessor.getNumber(row, "nonOrderSpf"), 0);
    const totalBenefits = getNumericValue(accessor.getNumber(row, "totalBenefits"), rewards + orderSpf + nonOrderSpf);

    // Settlement
    const bankSettlement = getNumericValue(accessor.getNumber(row, "bankSettlement"), 0);
    const itcGstTcs = getNumericValue(accessor.getNumber(row, "itcGstTcs"), 0);
    const itcTds = getNumericValue(accessor.getNumber(row, "itcTds"), 0);
    const inputTaxCredits = getNumericValue(accessor.getNumber(row, "inputTaxCredits"), itcGstTcs + itcTds);

    const netEarnings = getNumericValue(accessor.getNumber(row, "netEarnings"), 0);
    const earningsPerUnit = getNumericValue(
      accessor.getNumber(row, "earningsPerUnit"),
      netUnits > 0 ? netEarnings / netUnits : 0
    );

    const amountSettled = getNumericValue(accessor.getNumber(row, "amountSettled"), 0);
    const amountPending = getNumericValue(accessor.getNumber(row, "amountPending"), 0);

    const rawRecord = accessor.getRawRowMap(row);
    const unknownFields = accessor.getUnknownValues(row);

    records.push({
      sku,
      grossUnits,
      returnedCancelledUnits,
      rtoUnits,
      rvpUnits,
      cancelledUnits,
      netUnits,
      estimatedNetSales,
      orderItemValue,
      accountedNetSales,
      totalExpenses,
      expenses,
      commissionFee,
      collectionFee,
      fixedFee,
      pickAndPackFee,
      forwardShippingFee,
      reverseShippingFee,
      storageFee,
      recallFee,
      productCancellationFee,
      offerAdjustments,
      noCostEmiFeeReimbursement,
      installationFee,
      techVisitFee,
      uninstallationPackagingFee,
      customerAddOnsAmountRecovery: customerAddonsRecovery,
      franchiseFee,
      shopsyMarketingFee,
      taxesGst,
      taxesTcs,
      taxesTds,
      rewards,
      orderSpf,
      nonOrderSpf,
      totalBenefits,
      bankSettlement,
      inputTaxCredits,
      itcGstTcs,
      itcTds,
      netEarnings,
      earningsPerUnit,
      amountSettled,
      amountPending,
      rawRecord,
      unknownFields,
    });
  });

  return {
    records,
    columnsCount: headerMatrix.columns.length,
    hiddenCount: mapping.hiddenColumnsCount,
    mappedKeys: Array.from(mapping.mappedFieldKeys),
    unknownKeys: mapping.unknownColumns.map((c) => c.header),
    warnings: validation.warnings,
    errors: validation.errors,
  };
}

/**
 * Extracts transactions (Transaction 1..5 + Older) from an Order row
 */
function extractTransactions(
  row: unknown[],
  columns: { index: number; fullHeader: string; childHeader: string | null; parentHeader: string | null }[]
): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = [];

  const txnPrefixes = [
    { idx: 1, names: ["transaction1", "transaction-1", "txn1", "txn-1"] },
    { idx: 2, names: ["transaction2", "transaction-2", "txn2", "txn-2"] },
    { idx: 3, names: ["transaction3", "transaction-3", "txn3", "txn-3"] },
    { idx: 4, names: ["transaction4", "transaction-4", "txn4", "txn-4"] },
    { idx: 5, names: ["transaction5", "transaction-5", "txn5", "txn-5"] },
    { idx: 6, names: ["oldertransactions", "oldertransaction", "transaction-older", "oldertxn"] },
  ];

  txnPrefixes.forEach(({ idx, names }) => {
    let amountCol: number | null = null;
    let reasonCol: number | null = null;
    let statusCol: number | null = null;
    let dateCol: number | null = null;
    let accountCol: number | null = null;
    let neftCol: number | null = null;

    columns.forEach((col) => {
      const cleanFull = cleanHeaderString(col.fullHeader);
      const cleanParent = cleanHeaderString(col.parentHeader);
      const cleanChild = cleanHeaderString(col.childHeader);

      const matchesPrefix = names.some(
        (n) => cleanParent.includes(n) || cleanFull.includes(n)
      );

      if (matchesPrefix) {
        if (cleanChild.includes("amount") || cleanChild.includes("value") || cleanFull.includes("amount")) {
          amountCol = col.index;
        } else if (cleanChild.includes("reason") || cleanChild.includes("desc") || cleanFull.includes("reason")) {
          reasonCol = col.index;
        } else if (cleanChild.includes("status") || cleanFull.includes("status")) {
          statusCol = col.index;
        } else if (cleanChild.includes("date") || cleanFull.includes("date")) {
          dateCol = col.index;
        } else if (cleanChild.includes("account") || cleanFull.includes("account")) {
          accountCol = col.index;
        } else if (cleanChild.includes("neft") || cleanChild.includes("ref") || cleanFull.includes("neft")) {
          neftCol = col.index;
        }
      }
    });

    const amount = amountCol !== null ? getNumericValue(parseFinancialNumber(row[amountCol]), 0) : 0;
    const reason = reasonCol !== null ? parseString(row[reasonCol]).value : null;
    const status = statusCol !== null ? parseString(row[statusCol]).value : null;
    const paymentDate = dateCol !== null ? parseString(row[dateCol]).value : null;
    const accountType = accountCol !== null ? parseString(row[accountCol]).value : null;
    const neftId = neftCol !== null ? parseString(row[neftCol]).value : null;

    if (amount !== 0 || reason || paymentDate || neftId) {
      transactions.push({
        transactionIndex: idx,
        transactionAmount: amount,
        reason: reason || `Settlement #${idx}`,
        currentStatus: status || "Settled",
        paymentDate,
        accountType,
        neftId,
      });
    }
  });

  return transactions;
}

/**
 * Parses the Orders P&L sheet using matrix ingestion and column matching
 */
export function parseOrdersPnlSheet(sheet: XLSX.WorkSheet): {
  records: OrderPnlRecord[];
  columnsCount: number;
  hiddenCount: number;
  mappedKeys: string[];
  unknownKeys: string[];
  warnings: string[];
  errors: string[];
} {
  const headerMatrix = resolveWorksheetHeaders(sheet);
  const mapping = matchColumnsToSchema(headerMatrix.columns, PNL_V1_ORDERS_FIELDS, headerMatrix.dataRows);
  const validation = validateColumnMapping(mapping);
  const accessor = createRowAccessor(mapping, PNL_V1_ORDERS_FIELDS);

  const records: OrderPnlRecord[] = [];

  headerMatrix.dataRows.forEach((row) => {
    const orderId = accessor.getString(row, "orderId").value;
    const orderItemId = accessor.getString(row, "orderItemId").value;

    if (!orderId && !orderItemId) return;

    const finalOrderId = orderId || orderItemId!;
    const finalOrderItemId = orderItemId || orderId!;

    const orderDate = accessor.getString(row, "orderDate").value || null;
    const sku = accessor.getString(row, "sku").value || null;
    const fulfillmentType = accessor.getString(row, "fulfillmentType").value || null;
    const channelOfSale = accessor.getString(row, "channelOfSale").value || null;
    const modeOfPayment = accessor.getString(row, "modeOfPayment").value || null;
    const orderStatus = accessor.getString(row, "orderStatus").value || "Completed";

    // Units
    const grossUnits = getNumericValue(accessor.getInteger(row, "grossUnits"), 1);
    const returnedCancelledUnits = getNumericValue(accessor.getInteger(row, "returnedCancelledUnits"), 0);
    const rtoUnits = getNumericValue(accessor.getInteger(row, "rtoUnits"), 0);
    const rvpUnits = getNumericValue(accessor.getInteger(row, "rvpUnits"), 0);
    const cancelledUnits = getNumericValue(accessor.getInteger(row, "cancelledUnits"), 0);
    const netUnits = getNumericValue(
      accessor.getInteger(row, "netUnits"),
      grossUnits - (returnedCancelledUnits || rtoUnits + rvpUnits + cancelledUnits)
    );

    // Sales
    const orderItemValue = getNumericValue(accessor.getNumber(row, "orderItemValue"), 0);
    const finalSellingPrice = getNumericValue(accessor.getNumber(row, "finalSellingPrice"), orderItemValue);
    const handlingFee = getNumericValue(accessor.getNumber(row, "handlingFee"), 0);
    const estimatedNetSales = getNumericValue(accessor.getNumber(row, "estimatedNetSales"), finalSellingPrice + handlingFee);
    const accountedNetSales = getNumericValue(accessor.getNumber(row, "accountedNetSales"), estimatedNetSales);
    const grossSaleValue = getNumericValue(accessor.getNumber(row, "grossSaleValue"), orderItemValue);
    const sellerFundedDiscount = getNumericValue(accessor.getNumber(row, "sellerFundedDiscount"), 0);
    const customerAddOnsAmount = getNumericValue(accessor.getNumber(row, "customerAddOnsAmount"), 0);
    const totalCustomerDiscount = getNumericValue(accessor.getNumber(row, "totalCustomerDiscount"), 0);
    const offerId = accessor.getString(row, "offerId").value || null;

    // Expenses (Preserves negative values)
    const totalExpenses = getNumericValue(accessor.getNumber(row, "totalExpenses"), 0);
    const commissionFee = getNumericValue(accessor.getNumber(row, "commissionFee"), 0);
    const collectionFee = getNumericValue(accessor.getNumber(row, "collectionFee"), 0);
    const fixedFee = getNumericValue(accessor.getNumber(row, "fixedFee"), 0);
    const pickAndPackFee = getNumericValue(accessor.getNumber(row, "pickAndPackFee"), 0);
    const forwardShippingFee = getNumericValue(accessor.getNumber(row, "forwardShippingFee"), 0);
    const reverseShippingFee = getNumericValue(accessor.getNumber(row, "reverseShippingFee"), 0);
    const storageFee = getNumericValue(accessor.getNumber(row, "storageFee"), 0);
    const recallFee = getNumericValue(accessor.getNumber(row, "recallFee"), 0);
    const productCancellationFee = getNumericValue(accessor.getNumber(row, "productCancellationFee"), 0);
    const noCostEmiFeeReimbursement = getNumericValue(accessor.getNumber(row, "noCostEmiFeeReimbursement"), 0);
    const installationFee = getNumericValue(accessor.getNumber(row, "installationFee"), 0);
    const techVisitFee = getNumericValue(accessor.getNumber(row, "techVisitFee"), 0);
    const uninstallationPackagingFee = getNumericValue(accessor.getNumber(row, "uninstallationPackagingFee"), 0);
    const customerAddonsRecovery = getNumericValue(accessor.getNumber(row, "customerAddonsRecovery"), 0);
    const franchiseFee = getNumericValue(accessor.getNumber(row, "franchiseFee"), 0);
    const shopsyMarketingFee = getNumericValue(accessor.getNumber(row, "shopsyMarketingFee"), 0);
    const offerAdjustments = getNumericValue(accessor.getNumber(row, "offerAdjustments"), 0);

    const taxesGst = getNumericValue(accessor.getNumber(row, "taxesGst"), 0);
    const taxesTcs = getNumericValue(accessor.getNumber(row, "taxesTcs"), 0);
    const taxesTds = getNumericValue(accessor.getNumber(row, "taxesTds"), 0);

    const expenses: ExpenseBreakdown = {
      commissionFee,
      collectionFee,
      fixedFee,
      pickAndPackFee,
      forwardShippingFee,
      offerAdjustments,
      reverseShippingFee,
      storageFee,
      recallFee,
      noCostEmiFeeReimbursement,
      installationFee,
      techVisitFee,
      uninstallationPackagingFee,
      customerAddonsRecovery,
      franchiseFee,
      shopsyMarketingFee,
      productCancellationFee,
      gst: taxesGst,
      tcs: taxesTcs,
      tds: taxesTds,
    };

    // Benefits
    const rewards = getNumericValue(accessor.getNumber(row, "rewards"), 0);
    const spfPayout = getNumericValue(accessor.getNumber(row, "spfPayout"), 0);
    const totalBenefits = getNumericValue(accessor.getNumber(row, "totalBenefits"), rewards + spfPayout);

    // Settlement
    const bankSettlementProjected = getNumericValue(accessor.getNumber(row, "bankSettlementProjected"), 0);
    const itcGstTcs = getNumericValue(accessor.getNumber(row, "itcGstTcs"), 0);
    const itcTds = getNumericValue(accessor.getNumber(row, "itcTds"), 0);
    const inputTaxCredits = getNumericValue(accessor.getNumber(row, "inputTaxCredits"), itcGstTcs + itcTds);
    const netEarnings = getNumericValue(accessor.getNumber(row, "netEarnings"), 0);
    const amountSettled = getNumericValue(accessor.getNumber(row, "amountSettled"), 0);
    const amountPending = getNumericValue(accessor.getNumber(row, "amountPending"), 0);

    // Transactions
    const transactions = extractTransactions(row, headerMatrix.columns);

    const rawRecord = accessor.getRawRowMap(row);
    const unknownFields = accessor.getUnknownValues(row);

    records.push({
      orderDate,
      orderId: finalOrderId,
      orderItemId: finalOrderItemId,
      sku,
      fulfillmentType,
      channelOfSale,
      modeOfPayment,
      orderStatus,
      grossUnits,
      returnedCancelledUnits,
      rtoUnits,
      rvpUnits,
      cancelledUnits,
      netUnits,
      orderItemValue,
      finalSellingPrice,
      handlingFee,
      estimatedNetSales,
      accountedNetSales,
      grossSaleValue,
      sellerFundedDiscount,
      customerAddOnsAmount,
      totalCustomerDiscount,
      offerId,
      totalExpenses,
      expenses,
      commissionFee,
      collectionFee,
      fixedFee,
      pickAndPackFee,
      forwardShippingFee,
      reverseShippingFee,
      storageFee,
      recallFee,
      productCancellationFee,
      noCostEmiFeeReimbursement,
      installationFee,
      techVisitFee,
      uninstallationPackagingFee,
      customerAddOnsAmountRecovery: customerAddonsRecovery,
      franchiseFee,
      shopsyMarketingFee,
      offerAdjustments,
      taxesGst,
      taxesTcs,
      taxesTds,
      rewards,
      spfPayout,
      totalBenefits,
      bankSettlementProjected,
      inputTaxCredits,
      itcGstTcs,
      itcTds,
      netEarnings,
      amountSettled,
      amountPending,
      transactions,
      rawRecord,
      unknownFields,
    });
  });

  return {
    records,
    columnsCount: headerMatrix.columns.length,
    hiddenCount: mapping.hiddenColumnsCount,
    mappedKeys: Array.from(mapping.mappedFieldKeys),
    unknownKeys: mapping.unknownColumns.map((c) => c.header),
    warnings: validation.warnings,
    errors: validation.errors,
  };
}

/**
 * Master parser for Flipkart Profit & Loss Report
 */
export async function parseFlipkartPnlReport(file: File): Promise<PnlReport> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellDates: true,
    raw: true,
  });

  const summarySheetMatch = findSheetByName(workbook, ["Overall Summary", "OverallSummary", "Summary"]);
  const skuSheetMatch = findSheetByName(workbook, ["SKU-level P&L", "SKU Level P&L", "SKU P&L", "SKULevelPnL"]);
  const ordersSheetMatch = findSheetByName(workbook, ["Orders P&L", "Order P&L", "OrdersPnL", "Order Level P&L"]);
  const helpSheetMatch = findSheetByName(workbook, ["Report Help", "ReportHelp", "Help", "Dictionary"]);

  if (!skuSheetMatch && !ordersSheetMatch && !summarySheetMatch) {
    throw new Error(
      `This file does not appear to be a valid Flipkart Profit & Loss Report.\n` +
      `Expected sheets: "Overall Summary", "SKU-level P&L", "Orders P&L", but found: ${workbook.SheetNames.join(", ")}`
    );
  }

  const metadata = summarySheetMatch ? extractOverallSummary(summarySheetMatch.sheet) || undefined : undefined;

  const skuParse = skuSheetMatch
    ? parseSkuPnlSheet(skuSheetMatch.sheet)
    : { records: [], columnsCount: 0, hiddenCount: 0, mappedKeys: [], unknownKeys: [], warnings: [], errors: [] };

  const ordersParse = ordersSheetMatch
    ? parseOrdersPnlSheet(ordersSheetMatch.sheet)
    : { records: [], columnsCount: 0, hiddenCount: 0, mappedKeys: [], unknownKeys: [], warnings: [], errors: [] };

  const skuLevel = skuParse.records;
  const orders = ordersParse.records;

  if (skuLevel.length === 0 && orders.length === 0) {
    throw new Error("The uploaded P&L report contains sheets, but no valid SKU or Order data rows were found.");
  }

  // Financial consistency validations
  const skuFinValidation = validateSkuFinancials(skuLevel);
  const ordersFinValidation = validateOrdersFinancials(orders);

  const allWarnings = [
    ...skuParse.warnings,
    ...ordersParse.warnings,
    ...skuFinValidation.warnings,
    ...ordersFinValidation.warnings,
  ];

  const allUnknownFields = Array.from(new Set([...skuParse.unknownKeys, ...ordersParse.unknownKeys]));

  const expenseFieldsMapped = [
    "Commission Fee",
    "Collection Fee",
    "Fixed Fee",
    "Pick and Pack Fee",
    "Forward Shipping Fee",
    "Reverse Shipping Fee",
    "Storage Fee",
    "Recall Fee",
    "Taxes (GST)",
    "Taxes (TCS)",
    "Taxes (TDS)",
  ];

  const diagnostics: PnlParserDiagnostics = {
    skuColumnsDetected: skuParse.columnsCount,
    ordersColumnsDetected: ordersParse.columnsCount,
    skuRowsParsed: skuLevel.length,
    ordersRowsParsed: orders.length,
    hiddenColumnsIncluded: true,
    multiRowHeadersDetected: true,
    expenseFieldsMapped,
    unknownFieldsDetected: allUnknownFields,
    warnings: allWarnings,
  };

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: workbook.SheetNames,
    skuSheetName: skuSheetMatch ? skuSheetMatch.name : "SKU-level P&L",
    ordersSheetName: ordersSheetMatch ? ordersSheetMatch.name : "Orders P&L",
    summarySheetName: summarySheetMatch ? summarySheetMatch.name : undefined,
    helpSheetName: helpSheetMatch ? helpSheetMatch.name : undefined,
    metadata,
    skuLevel,
    orders,
    diagnostics,
    parsedAt: new Date().toISOString(),
  };
}
