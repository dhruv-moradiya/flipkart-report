import * as XLSX from "xlsx";
import { SkuPnlRecord, OrderPnlRecord, PnlReport, ExpenseBreakdown, PnlParserDiagnostics } from "../types/pnl.types";
import { SettlementTransaction } from "@/features/reports/types/journey.types";
import { extractOverallSummary } from "@/features/reports/utils/report-detector";
import {
  parseMultiRowHeaderSheet,
  createRowGetter,
  cleanHeaderString,
  ExcelColumnDefinition,
} from "@/features/reports/parsers/excel/multi-row-header";

/**
 * Normalizes numeric cell values safely while preserving negative signs
 */
function parseFinancialNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;

  const str = String(val).trim().replace(/,/g, "").replace(/₹/g, "").replace(/\s/g, "");
  if (!str) return fallback;

  // Handle accounting parentheses: "(196.50)" -> -196.50
  if (str.startsWith("(") && str.endsWith(")")) {
    const inner = str.slice(1, -1);
    const num = Number(inner);
    return isNaN(num) ? fallback : -num;
  }

  const num = Number(str);
  return isNaN(num) ? fallback : num;
}

/**
 * Normalizes integer values
 */
function parseInteger(val: unknown, fallback = 0): number {
  const num = parseFinancialNumber(val, fallback);
  return Math.round(num);
}

/**
 * Normalizes strings safely
 */
function parseString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Finds sheet by fuzzy name matching
 */
export function findSheetByName(workbook: XLSX.WorkBook, patterns: string[]): { name: string; sheet: XLSX.WorkSheet } | null {
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
 * Parses the 49-column SKU-level P&L sheet using 2-row headers and merged cell propagation
 */
export function parseSkuPnlSheet(sheet: XLSX.WorkSheet): { records: SkuPnlRecord[]; columns: ExcelColumnDefinition[] } {
  const { columns, dataRows } = parseMultiRowHeaderSheet(sheet, 2);
  const getter = createRowGetter(columns);

  const records: SkuPnlRecord[] = [];

  for (const row of dataRows) {
    const sku = parseString(getter.getValue(row, ["SKU ID", "SKU", "SKU Name", "Seller SKU", "Product SKU"]));
    if (!sku) continue;

    const grossUnits = parseInteger(getter.getValue(row, ["Gross Units (#)", "Gross Units", "Total Units", "Units Sold"]), 0);
    const returnedCancelledUnits = parseInteger(
      getter.getValue(row, ["Returned & Cancelled Units", "Returned & Cancelled", "Returned and Cancelled Units"]),
      0
    );
    const rtoUnits = parseInteger(getter.getValue(row, ["RTO (Logistics Return)", "RTO", "Logistics Return"]), 0);
    const rvpUnits = parseInteger(getter.getValue(row, ["RVP (Customer Return)", "RVP", "Customer Return"]), 0);
    const cancelledUnits = parseInteger(getter.getValue(row, ["Cancellations", "Cancelled Units", "Cancelled"]), 0);

    const netUnits = parseInteger(
      getter.getValue(row, ["Net Units (#)", "Net Units", "Net Unit"]),
      grossUnits - (returnedCancelledUnits || rtoUnits + rvpUnits + cancelledUnits)
    );

    const estimatedNetSales = parseFinancialNumber(getter.getValue(row, ["Estimated Net Sales (INR)", "Estimated Net Sales", "Estimated Sales"]), 0);
    const orderItemValue = parseFinancialNumber(getter.getValue(row, ["Sum of Order Item Value", "Order Item Value", "Item Value"]), 0);
    const accountedNetSales = parseFinancialNumber(
      getter.getValue(row, ["Accounted Net Sales (Seller Price)", "Accounted Net Sales", "Seller Price"]),
      estimatedNetSales
    );

    // Official Total Expenses
    const totalExpenses = parseFinancialNumber(getter.getValue(row, ["Total Expenses (INR)", "Total Expenses", "Expenses"]), 0);

    // Granular Fee Breakups from Row 2 (preserving negative values)
    const commissionFee = parseFinancialNumber(getter.getValue(row, ["Commission Fee", "Total Expenses (Breakup) / Commission Fee"]), 0);
    const collectionFee = parseFinancialNumber(getter.getValue(row, ["Collection Fee", "Total Expenses (Breakup) / Collection Fee"]), 0);
    const fixedFee = parseFinancialNumber(getter.getValue(row, ["Fixed Fee", "Total Expenses (Breakup) / Fixed Fee"]), 0);
    const pickAndPackFee = parseFinancialNumber(getter.getValue(row, ["Pick and Pack Fee", "Pick & Pack Fee", "Total Expenses (Breakup) / Pick and Pack Fee"]), 0);
    const forwardShippingFee = parseFinancialNumber(getter.getValue(row, ["Forward Shipping Fee", "Forward Shipping", "Total Expenses (Breakup) / Forward Shipping Fee"]), 0);
    const reverseShippingFee = parseFinancialNumber(getter.getValue(row, ["Reverse Shipping Fee", "Reverse Shipping", "Total Expenses (Breakup) / Reverse Shipping Fee"]), 0);
    const storageFee = parseFinancialNumber(getter.getValue(row, ["Storage Fee", "Total Expenses (Breakup) / Storage Fee"]), 0);
    const recallFee = parseFinancialNumber(getter.getValue(row, ["Recall Fee", "Total Expenses (Breakup) / Recall Fee"]), 0);
    const productCancellationFee = parseFinancialNumber(
      getter.getValue(row, ["Product Cancellation Fee (Rs.)", "Product Cancellation Fee", "Total Expenses (Breakup) / Product Cancellation Fee (Rs.)"]),
      0
    );
    const offerAdjustments = parseFinancialNumber(getter.getValue(row, ["Offer adjustments", "Offer Adjustments", "Total Expenses (Breakup) / Offer adjustments"]), 0);
    const noCostEmiFeeReimbursement = parseFinancialNumber(
      getter.getValue(row, ["No Cost Emi Fee Reimbursement(Rs.)", "No Cost Emi Fee Reimbursement", "No Cost EMI", "Total Expenses (Breakup) / No Cost Emi Fee Reimbursement(Rs.)"]),
      0
    );
    const installationFee = parseFinancialNumber(getter.getValue(row, ["Installation Fee (Rs.)", "Installation Fee", "Total Expenses (Breakup) / Installation Fee (Rs.)"]), 0);
    const techVisitFee = parseFinancialNumber(getter.getValue(row, ["Tech Visit Fee (Rs.)", "Tech Visit Fee", "Total Expenses (Breakup) / Tech Visit Fee (Rs.)"]), 0);
    const uninstallationPackagingFee = parseFinancialNumber(
      getter.getValue(row, ["Uninstallation & Packaging Fee (Rs.)", "Uninstallation & Packaging Fee", "Total Expenses (Breakup) / Uninstallation & Packaging Fee (Rs.)"]),
      0
    );
    const customerAddonsRecovery = parseFinancialNumber(
      getter.getValue(row, ["Customer Add-ons Amount Recovery (Rs.)", "Customer Add-ons Amount Recovery", "Total Expenses (Breakup) / Customer Add-ons Amount Recovery (Rs.)"]),
      0
    );
    const franchiseFee = parseFinancialNumber(getter.getValue(row, ["Franchise Fee (Rs.)", "Franchise Fee", "Total Expenses (Breakup) / Franchise Fee (Rs.)"]), 0);
    const shopsyMarketingFee = parseFinancialNumber(
      getter.getValue(row, ["Shopsy Marketing Fee (Rs.)", "Shopsy Marketing Fee", "Total Expenses (Breakup) / Shopsy Marketing Fee (Rs.)"]),
      0
    );

    // Taxes
    const taxesGst = parseFinancialNumber(getter.getValue(row, ["Taxes (GST)", "GST", "Total Expenses (Breakup) / Taxes (GST)"]), 0);
    const taxesTcs = parseFinancialNumber(getter.getValue(row, ["Taxes (TCS)", "TCS", "Total Expenses (Breakup) / Taxes (TCS)"]), 0);
    const taxesTds = parseFinancialNumber(getter.getValue(row, ["Taxes (TDS)", "TDS", "Total Expenses (Breakup) / Taxes (TDS)"]), 0);

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
    const rewards = parseFinancialNumber(getter.getValue(row, ["Rewards", "Rewards & Other Benefits(Breakup) / Rewards"]), 0);
    const orderSpf = parseFinancialNumber(getter.getValue(row, ["Order SPF", "Rewards & Other Benefits(Breakup) / Order SPF"]), 0);
    const nonOrderSpf = parseFinancialNumber(getter.getValue(row, ["Non Order SPF", "Non-Order SPF", "Rewards & Other Benefits(Breakup) / Non Order SPF"]), 0);
    const totalBenefits = parseFinancialNumber(
      getter.getValue(row, ["Rewards & Other Benefits (INR)", "Rewards & Other Benefits", "Total Benefits"]),
      rewards + orderSpf + nonOrderSpf
    );

    // Settlement
    const bankSettlement = parseFinancialNumber(getter.getValue(row, ["Bank Settlement [Projected] (INR)", "Bank Settlement", "Projected Bank Settlement"]), 0);
    const itcGstTcs = parseFinancialNumber(getter.getValue(row, ["GST + TCS", "Input Tax Credits (Breakup) / GST + TCS"]), 0);
    const itcTds = parseFinancialNumber(getter.getValue(row, ["TDS", "Input Tax Credits (Breakup) / TDS"]), 0);
    const inputTaxCredits = parseFinancialNumber(getter.getValue(row, ["Input Tax Credits (INR)", "Input Tax Credits", "Total ITC"]), itcGstTcs + itcTds);

    const netEarnings = parseFinancialNumber(getter.getValue(row, ["Net Earnings (INR)", "Net Earnings", "Earnings"]), 0);
    const earningsPerUnit = parseFinancialNumber(
      getter.getValue(row, ["Earnings per unit (INR)", "Earnings per unit", "Earnings Per Unit"]),
      netUnits > 0 ? netEarnings / netUnits : 0
    );

    const amountSettled = parseFinancialNumber(getter.getValue(row, ["Amount Settled (INR)", "Amount Settled", "Settled"]), 0);
    const amountPending = parseFinancialNumber(getter.getValue(row, ["Amount Pending (INR)", "Amount Pending", "Pending"]), 0);

    const record: SkuPnlRecord = {
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
      rawRecord: row as unknown as Record<string, unknown>,
    };

    records.push(record);
  }

  return { records, columns };
}

/**
 * Extracts transactions (Transaction 1..5, Older) from an Order row
 */
function extractTransactionsFromRow(
  row: unknown[],
  getter: ReturnType<typeof createRowGetter>
): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = [];

  const txnPrefixes = [
    { idx: 1, names: ["Transaction-1", "Transaction 1", "Txn-1", "Txn 1"] },
    { idx: 2, names: ["Transaction-2", "Transaction 2", "Txn-2", "Txn 2"] },
    { idx: 3, names: ["Transaction-3", "Transaction 3", "Txn-3", "Txn 3"] },
    { idx: 4, names: ["Transaction-4", "Transaction 4", "Txn-4", "Txn 4"] },
    { idx: 5, names: ["Transaction-5", "Transaction 5", "Txn-5", "Txn 5"] },
    { idx: 6, names: ["Older Transactions", "Older Transaction", "Transaction-Older", "Older Txn"] },
  ];

  txnPrefixes.forEach(({ idx, names }) => {
    const amountAliases: string[] = [];
    const reasonAliases: string[] = [];
    const statusAliases: string[] = [];
    const dateAliases: string[] = [];
    const accountAliases: string[] = [];
    const neftAliases: string[] = [];

    names.forEach((p) => {
      amountAliases.push(`${p} / Transaction Amount`, `${p}: Transaction Amount`, `${p} Transaction Amount`, `${p} Amount`, `${p} Value`);
      reasonAliases.push(`${p} / Reason`, `${p}: Reason`, `${p} Reason`, `${p} Description`);
      statusAliases.push(`${p} / Current Status`, `${p}: Current Status`, `${p} Current Status`, `${p} Status`);
      dateAliases.push(`${p} / Payment Date`, `${p}: Payment Date`, `${p} Payment Date`, `${p} Date`);
      accountAliases.push(`${p} / Account Type`, `${p}: Account Type`, `${p} Account Type`, `${p} Account`);
      neftAliases.push(`${p} / NEFT ID`, `${p}: NEFT ID`, `${p} NEFT ID`, `${p} NEFT`, `${p} Reference`);
    });

    const amount = parseFinancialNumber(getter.getValue(row, amountAliases), 0);
    const reason = parseString(getter.getValue(row, reasonAliases));
    const currentStatus = parseString(getter.getValue(row, statusAliases)) || "Settled";
    const paymentDate = parseString(getter.getValue(row, dateAliases)) || null;
    const accountType = parseString(getter.getValue(row, accountAliases)) || null;
    const neftId = parseString(getter.getValue(row, neftAliases)) || null;

    if (amount !== 0 || reason || paymentDate || neftId) {
      transactions.push({
        transactionIndex: idx,
        transactionAmount: amount,
        reason: reason || `Settlement #${idx}`,
        currentStatus,
        paymentDate,
        accountType,
        neftId,
      });
    }
  });

  return transactions;
}

/**
 * Parses the 90-column Orders P&L sheet using 2-row headers and merged cell propagation
 */
export function parseOrdersPnlSheet(sheet: XLSX.WorkSheet): { records: OrderPnlRecord[]; columns: ExcelColumnDefinition[] } {
  const { columns, dataRows } = parseMultiRowHeaderSheet(sheet, 2);
  const getter = createRowGetter(columns);

  const records: OrderPnlRecord[] = [];

  for (const row of dataRows) {
    const orderId = parseString(getter.getValue(row, ["Order ID", "OrderId", "Order Number"]));
    const orderItemId = parseString(getter.getValue(row, ["Order Item ID", "OrderItemId", "Item ID"]));

    if (!orderId && !orderItemId) continue;

    const orderDate = parseString(getter.getValue(row, ["Order Date", "Date", "Ordered Date"])) || null;
    const sku = parseString(getter.getValue(row, ["SKU Name", "SKU", "SKU ID", "Seller SKU", "Product SKU"])) || null;

    const fulfillmentType = parseString(getter.getValue(row, ["Fulfillment Type", "FF Type", "Fulfilment"])) || null;
    const channelOfSale = parseString(getter.getValue(row, ["Channel of Sale", "Channel"])) || null;
    const modeOfPayment = parseString(getter.getValue(row, ["Mode of Payment", "Payment Mode", "Payment Type"])) || null;
    const orderStatus = parseString(getter.getValue(row, ["Order Status", "Status", "Item Status"])) || "Completed";

    // Units
    const grossUnits = parseInteger(getter.getValue(row, ["Gross Units", "Quantity", "Qty"]), 1);
    const returnedCancelledUnits = parseInteger(
      getter.getValue(row, ["Returned & Cancelled Units", "Returned & Cancelled"]),
      0
    );
    const rtoUnits = parseInteger(getter.getValue(row, ["RTO (Logistics Return)", "Returned & Cancelled Units (Breakup) / RTO (Logistics Return)", "RTO"]), 0);
    const rvpUnits = parseInteger(getter.getValue(row, ["RVP (Customer Return)", "Returned & Cancelled Units (Breakup) / RVP (Customer Return)", "RVP"]), 0);
    const cancelledUnits = parseInteger(getter.getValue(row, ["Cancelled Units", "Returned & Cancelled Units (Breakup) / Cancelled Units", "Cancellations"]), 0);
    const netUnits = parseInteger(getter.getValue(row, ["Net Units"]), grossUnits - (returnedCancelledUnits || rtoUnits + rvpUnits + cancelledUnits));

    // Sales
    const orderItemValue = parseFinancialNumber(getter.getValue(row, ["Order Item Value", "Item Value", "Price"]), 0);
    const finalSellingPrice = parseFinancialNumber(getter.getValue(row, ["Final Selling Price (FSP)", "Final Selling Price", "Selling Price"]), orderItemValue);
    const handlingFee = parseFinancialNumber(getter.getValue(row, ["Handling Fee", "Customer Logistics Fee"]), 0);
    const estimatedNetSales = parseFinancialNumber(getter.getValue(row, ["Estimated Net Sales (INR)", "Estimated Net Sales"]), finalSellingPrice + handlingFee);
    const accountedNetSales = parseFinancialNumber(getter.getValue(row, ["Accounted Net Sales (Seller Price)", "Accounted Net Sales", "Seller Price"]), estimatedNetSales);
    const grossSaleValue = parseFinancialNumber(
      getter.getValue(row, ["Gross Sale Value", "Accounted Net Sales (Seller Price) (Breakup) / Gross Sale Value"]),
      orderItemValue
    );
    const sellerFundedDiscount = parseFinancialNumber(
      getter.getValue(row, ["Seller-Funded Discount", "Accounted Net Sales (Seller Price) (Breakup) / Seller-Funded Discount"]),
      0
    );
    const customerAddOnsAmount = parseFinancialNumber(
      getter.getValue(row, ["Customer Add-Ons Amount", "Accounted Net Sales (Seller Price) (Breakup) / Customer Add-Ons Amount"]),
      0
    );
    const totalCustomerDiscount = parseFinancialNumber(
      getter.getValue(row, ["Total Customer Discount", "Offer Details / Total Customer Discount"]),
      0
    );
    const offerId = parseString(getter.getValue(row, ["Offer Id", "Offer Details / Offer Id", "Offer ID"])) || null;

    // Expenses
    const totalExpenses = parseFinancialNumber(getter.getValue(row, ["Total Expenses (INR)", "Total Expenses", "Expenses"]), 0);
    const commissionFee = parseFinancialNumber(getter.getValue(row, ["Commission Fee", "Total Expenses (Breakup) / Commission Fee"]), 0);
    const collectionFee = parseFinancialNumber(getter.getValue(row, ["Collection Fee", "Total Expenses (Breakup) / Collection Fee"]), 0);
    const fixedFee = parseFinancialNumber(getter.getValue(row, ["Fixed Fee", "Total Expenses (Breakup) / Fixed Fee"]), 0);
    const pickAndPackFee = parseFinancialNumber(getter.getValue(row, ["Pick and Pack Fee", "Pick & Pack Fee", "Total Expenses (Breakup) / Pick and Pack Fee"]), 0);
    const forwardShippingFee = parseFinancialNumber(getter.getValue(row, ["Forward Shipping Fee", "Forward Shipping", "Total Expenses (Breakup) / Forward Shipping Fee"]), 0);
    const reverseShippingFee = parseFinancialNumber(getter.getValue(row, ["Reverse Shipping Fee", "Reverse Shipping", "Total Expenses (Breakup) / Reverse Shipping Fee"]), 0);
    const storageFee = parseFinancialNumber(getter.getValue(row, ["Storage Fee", "Total Expenses (Breakup) / Storage Fee"]), 0);
    const recallFee = parseFinancialNumber(getter.getValue(row, ["Recall Fee", "Total Expenses (Breakup) / Recall Fee"]), 0);
    const productCancellationFee = parseFinancialNumber(
      getter.getValue(row, ["Product Cancellation Fee (Rs.)", "Product Cancellation Fee", "Total Expenses (Breakup) / Product Cancellation Fee (Rs.)"]),
      0
    );
    const noCostEmiFeeReimbursement = parseFinancialNumber(
      getter.getValue(row, ["No Cost EMI Fee Reimbursement", "No Cost Emi Fee Reimbursement(Rs.)", "Total Expenses (Breakup) / No Cost Emi Fee Reimbursement(Rs.)"]),
      0
    );
    const installationFee = parseFinancialNumber(getter.getValue(row, ["Installation Fee (Rs.)", "Installation Fee", "Total Expenses (Breakup) / Installation Fee (Rs.)"]), 0);
    const techVisitFee = parseFinancialNumber(getter.getValue(row, ["Tech Visit Fee (Rs.)", "Tech Visit Fee", "Total Expenses (Breakup) / Tech Visit Fee (Rs.)"]), 0);
    const uninstallationPackagingFee = parseFinancialNumber(
      getter.getValue(row, ["Uninstallation & Packaging Fee (Rs.)", "Uninstallation & Packaging Fee", "Total Expenses (Breakup) / Uninstallation & Packaging Fee (Rs.)"]),
      0
    );
    const customerAddonsRecovery = parseFinancialNumber(
      getter.getValue(row, ["Customer Add-ons Amount Recovery (Rs.)", "Customer Add-ons Amount Recovery", "Total Expenses (Breakup) / Customer Add-ons Amount Recovery (Rs.)"]),
      0
    );
    const franchiseFee = parseFinancialNumber(getter.getValue(row, ["Franchise Fee (Rs.)", "Franchise Fee", "Total Expenses (Breakup) / Franchise Fee (Rs.)"]), 0);
    const shopsyMarketingFee = parseFinancialNumber(
      getter.getValue(row, ["Shopsy Marketing Fee (Rs.)", "Shopsy Marketing Fee", "Total Expenses (Breakup) / Shopsy Marketing Fee (Rs.)"]),
      0
    );
    const offerAdjustments = parseFinancialNumber(getter.getValue(row, ["Offer adjustments", "Offer Adjustments", "Total Expenses (Breakup) / Offer adjustments"]), 0);

    // Taxes
    const taxesGst = parseFinancialNumber(getter.getValue(row, ["Taxes (GST)", "GST", "Total Expenses (Breakup) / Taxes (GST)"]), 0);
    const taxesTcs = parseFinancialNumber(getter.getValue(row, ["Taxes (TCS)", "TCS", "Total Expenses (Breakup) / Taxes (TCS)"]), 0);
    const taxesTds = parseFinancialNumber(getter.getValue(row, ["Taxes (TDS)", "TDS", "Total Expenses (Breakup) / Taxes (TDS)"]), 0);

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
    const rewards = parseFinancialNumber(getter.getValue(row, ["Rewards", "Total Benefits (Breakup) / Rewards"]), 0);
    const spfPayout = parseFinancialNumber(getter.getValue(row, ["SPF Payout", "SPF Claim", "Order SPF", "Total Benefits (Breakup) / SPF Payout"]), 0);
    const totalBenefits = parseFinancialNumber(getter.getValue(row, ["Rewards & Other Benefits (INR)", "Rewards & Other Benefits", "Total Benefits"]), rewards + spfPayout);

    // Settlement
    const bankSettlementProjected = parseFinancialNumber(getter.getValue(row, ["Bank Settlement [Projected]", "Bank Settlement"]), 0);
    const itcGstTcs = parseFinancialNumber(getter.getValue(row, ["GST + TCS", "Input Tax Credits (Breakup) / GST + TCS"]), 0);
    const itcTds = parseFinancialNumber(getter.getValue(row, ["TDS", "Input Tax Credits (Breakup) / TDS"]), 0);
    const inputTaxCredits = parseFinancialNumber(getter.getValue(row, ["Input Tax Credits (INR)", "Input Tax Credits", "Total ITC"]), itcGstTcs + itcTds);
    const netEarnings = parseFinancialNumber(getter.getValue(row, ["Net Earnings (INR)", "Net Earnings", "Earnings"]), 0);
    const amountSettled = parseFinancialNumber(getter.getValue(row, ["Amount Settled (INR)", "Amount Settled", "Settled"]), 0);
    const amountPending = parseFinancialNumber(getter.getValue(row, ["Amount Pending (INR)", "Amount Pending", "Pending"]), 0);

    // Settlement Transactions History
    const transactions = extractTransactionsFromRow(row, getter);

    const record: OrderPnlRecord = {
      orderDate,
      orderId: orderId || orderItemId,
      orderItemId: orderItemId || orderId,
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
      rawRecord: row as unknown as Record<string, unknown>,
    };

    records.push(record);
  }

  return { records, columns };
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

  const skuParse = skuSheetMatch ? parseSkuPnlSheet(skuSheetMatch.sheet) : { records: [], columns: [] };
  const ordersParse = ordersSheetMatch ? parseOrdersPnlSheet(ordersSheetMatch.sheet) : { records: [], columns: [] };

  const skuLevel = skuParse.records;
  const orders = ordersParse.records;

  if (skuLevel.length === 0 && orders.length === 0) {
    throw new Error("The uploaded P&L report contains sheets, but no valid SKU or Order data rows were found.");
  }

  // Diagnostics & Validation
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
    skuColumnsDetected: skuParse.columns.length,
    ordersColumnsDetected: ordersParse.columns.length,
    skuRowsParsed: skuLevel.length,
    ordersRowsParsed: orders.length,
    hiddenColumnsIncluded: true,
    multiRowHeadersDetected: true,
    expenseFieldsMapped,
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
