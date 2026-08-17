import { OverallSummaryMetadata } from "../types/report.types";
import { ParsedValue } from "../excel/value-parser";

export interface ParsedRecord<T> {
  normalized: T;
  raw: Record<string, unknown>;
  source: {
    sheet: string;
    rowNumber: number;
  };
  unknownFields?: Record<string, unknown>;
}

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

export interface TransactionRecord {
  sequence: number | "older";
  amount: number | null;
  reason: string | null;
  currentStatus: string | null;
  paymentDate: Date | string | null;
  accountType: string | null;
  neftId: string | null;
}

// Backwards compat alias for TransactionRecord
export interface SettlementTransaction {
  transactionIndex: number;
  transactionAmount: number;
  reason: string;
  currentStatus: string;
  paymentDate: string | null;
  accountType: string | null;
  neftId: string | null;
}

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

  totalExpenses: number;
  expenses: ExpenseBreakdown;

  // Flattened fee fields (preserving negative values)
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

  // Raw & Unknown data preservation
  rawRecord?: Record<string, unknown>;
  unknownFields?: Record<string, unknown>;
}

export interface OrderPnlRecord {
  orderDate: string | null;
  orderId: string;
  orderItemId: string;
  sku: string | null;
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

  // Expenses
  totalExpenses: number;
  expenses: ExpenseBreakdown;
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

  // Transactions
  transactions: SettlementTransaction[];

  // Raw & Unknown data preservation
  rawRecord?: Record<string, unknown>;
  unknownFields?: Record<string, unknown>;
}

export interface PnlParserDiagnostics {
  skuColumnsDetected: number;
  ordersColumnsDetected: number;
  skuRowsParsed: number;
  ordersRowsParsed: number;
  hiddenColumnsIncluded: boolean;
  multiRowHeadersDetected: boolean;
  expenseFieldsMapped: string[];
  unknownFieldsDetected?: string[];
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
