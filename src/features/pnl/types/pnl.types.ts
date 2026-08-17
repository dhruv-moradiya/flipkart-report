import { SettlementTransaction } from "@/features/reports/types/journey.types";
import { OverallSummaryMetadata } from "@/features/reports/types/report.types";

/**
 * Detailed Expense and Fee Breakdown
 * Preserves exact numerical signs (expenses are typically negative in Flipkart reports)
 */
export interface ExpenseBreakdown {
  commissionFee: number;
  collectionFee: number;
  fixedFee: number;
  pickAndPackFee: number;
  forwardShippingFee: number;
  offerAdjustments: number;
  reverseShippingFee: number;
  storageFee: number;
  recallFee: number;
  noCostEmiFeeReimbursement: number;
  installationFee: number;
  techVisitFee: number;
  uninstallationPackagingFee: number;
  customerAddonsRecovery: number;
  franchiseFee: number;
  shopsyMarketingFee: number;
  productCancellationFee: number;

  gst: number;
  tcs: number;
  tds: number;
}

/**
 * 49-Column SKU-level P&L Normalized Record
 */
export interface SkuPnlRecord {
  sku: string;

  grossUnits: number;
  returnedCancelledUnits: number;
  rtoUnits: number;
  rvpUnits: number;
  cancelledUnits: number;
  netUnits: number;

  estimatedNetSales: number;
  orderItemValue: number;
  accountedNetSales: number;

  // Total Expenses (Official Flipkart total)
  totalExpenses: number;

  // Complete Expense & Fee Breakdown
  expenses: ExpenseBreakdown;

  // Top-level aliases for direct property access
  commissionFee: number;
  collectionFee: number;
  fixedFee: number;
  pickAndPackFee: number;
  forwardShippingFee: number;
  reverseShippingFee: number;
  storageFee: number;
  recallFee: number;
  productCancellationFee: number;
  offerAdjustments: number;
  noCostEmiFeeReimbursement: number;
  installationFee: number;
  techVisitFee: number;
  uninstallationPackagingFee: number;
  customerAddOnsAmountRecovery: number;
  franchiseFee: number;
  shopsyMarketingFee: number;

  // Taxes
  taxesGst: number;
  taxesTcs: number;
  taxesTds: number;

  // Benefits
  rewards: number;
  orderSpf: number;
  nonOrderSpf: number;
  totalBenefits: number;

  // Settlement
  bankSettlement: number;
  inputTaxCredits: number;
  itcGstTcs: number;
  itcTds: number;

  netEarnings: number;
  earningsPerUnit: number;

  amountSettled: number;
  amountPending: number;

  rawRecord?: Record<string, unknown>;
}

/**
 * 90-Column Orders P&L Normalized Record
 */
export interface OrderPnlRecord {
  orderDate: string | null;
  orderId: string;
  orderItemId: string;
  sku: string | null;

  // Order Details
  fulfillmentType: string | null;
  channelOfSale: string | null;
  modeOfPayment: string | null;
  orderStatus: string;

  // Units
  grossUnits: number;
  returnedCancelledUnits: number;
  rtoUnits: number;
  rvpUnits: number;
  cancelledUnits: number;
  netUnits: number;

  // Sales
  orderItemValue: number;
  finalSellingPrice: number;
  handlingFee: number;
  estimatedNetSales: number;
  accountedNetSales: number;
  grossSaleValue: number;
  sellerFundedDiscount: number;
  customerAddOnsAmount: number;
  totalCustomerDiscount: number;
  offerId: string | null;

  // Total Expenses (Official Flipkart total)
  totalExpenses: number;

  // Complete Expense & Fee Breakdown
  expenses: ExpenseBreakdown;

  // Top-level aliases
  commissionFee: number;
  collectionFee: number;
  fixedFee: number;
  pickAndPackFee: number;
  forwardShippingFee: number;
  reverseShippingFee: number;
  storageFee: number;
  recallFee: number;
  productCancellationFee: number;
  noCostEmiFeeReimbursement: number;
  installationFee: number;
  techVisitFee: number;
  uninstallationPackagingFee: number;
  customerAddOnsAmountRecovery: number;
  franchiseFee: number;
  shopsyMarketingFee: number;
  offerAdjustments: number;

  // Taxes
  taxesGst: number;
  taxesTcs: number;
  taxesTds: number;

  // Benefits
  rewards: number;
  spfPayout: number;
  totalBenefits: number;

  // Settlement
  bankSettlementProjected: number;
  inputTaxCredits: number;
  itcGstTcs: number;
  itcTds: number;
  netEarnings: number;
  amountSettled: number;
  amountPending: number;

  // Settlement Transactions History (Transaction-1 to 5 + Older)
  transactions: SettlementTransaction[];

  rawRecord?: Record<string, unknown>;
}

export interface PnlParserDiagnostics {
  skuColumnsDetected: number;
  ordersColumnsDetected: number;
  skuRowsParsed: number;
  ordersRowsParsed: number;
  hiddenColumnsIncluded: boolean;
  multiRowHeadersDetected: boolean;
  expenseFieldsMapped: string[];
  calculatedExpenseDifference?: number;
  warnings?: string[];
}

export interface PnlReport {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  skuSheetName: string;
  ordersSheetName: string;
  summarySheetName?: string;
  helpSheetName?: string;
  metadata?: OverallSummaryMetadata;
  skuLevel: SkuPnlRecord[];
  orders: OrderPnlRecord[];
  diagnostics?: PnlParserDiagnostics;
  parsedAt: string;
}
