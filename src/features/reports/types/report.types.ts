export type ReportType =
  | "profit_loss"
  | "returns"
  | "gst"
  | "inventory"
  | "orders"
  | "settlement"
  | "sku_pnl_orders_pnl"
  | "unknown";

export interface ReportTypeOption {
  id: ReportType;
  title: string;
  subtitle: string;
  description: string;
  expectedSheets: string[];
  supported: boolean;
}

export const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    id: "profit_loss",
    title: "Flipkart Profit & Loss Report",
    subtitle: "Overall Summary, SKU P&L, Orders P&L, Report Help",
    description: "Evaluates complete product profitability, order-level economics, fee breakups, and settlement transactions.",
    expectedSheets: ["Overall Summary", "SKU-level P&L", "Orders P&L", "Report Help"],
    supported: true,
  },
  {
    id: "returns",
    title: "Flipkart Returns Report",
    subtitle: "43-Column Reverse Logistics & Return Lifecycle",
    description: "Evaluates return requests, customer vs courier returns, tracking IDs, transit stages, and customer comments.",
    expectedSheets: ["Returns", "Sheet1", "Returns Data"],
    supported: true,
  },
  {
    id: "settlement",
    title: "Flipkart Settled Transactions Report",
    subtitle: "15-Sheet Financial Settlement Ledger & Bank Payouts",
    description: "Reconciles actual bank payouts, GST/TCS/TDS credits, marketplace fees, refunds, and Protection Fund claims.",
    expectedSheets: ["Summary of report", "Orders", "GST_Details", "Report Help"],
    supported: true,
  },
  {
    id: "gst",
    title: "GST / GSTR Report",
    subtitle: "Tax Invoices & GSTR-1 Summaries",
    description: "B2B / B2C tax compliance, HSN code breakdowns, and GST rate summaries (coming soon).",
    expectedSheets: ["GSTR-1", "B2B Invoices"],
    supported: false,
  },
];

export interface OverallSummaryMetadata {
  reportType: string;
  ordersReceivedPeriod?: string;
  generatedOn?: string;
  sellerId?: string;
  rawMetadata?: Record<string, string>;
}

export interface ReportDateRange {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  periodLabel: string; // "01 Aug 2026 – 13 Aug 2026" or "August 2026"
  reportingPeriod: string; // "2026-08"
  selectedMonth?: number;
  selectedYear?: number;
  source?: string;
}

export interface ReportMetadata {
  reportType: ReportType;
  periodStart: Date | null;
  periodEnd: Date | null;
  generatedAt: Date | null;
  filename: string;
  uploadedAt: Date;
}

export interface ReportDetectionResult {
  type: ReportType;
  confidence: number;
  version: string | null;
  sheets: string[];
  warnings: string[];
  errors: string[];
  suggestedOption?: ReportTypeOption | null;
  overallSummary?: OverallSummaryMetadata | null;
}

// Backwards compatibility alias
export interface WorkbookDetectionResult extends ReportDetectionResult {
  detectedType: ReportType;
  sheetNames: string[];
  matchingSheets: string[];
  validationError?: string | null;
}

export interface UploadedReportsState {
  pnlActive: boolean;
  returnsActive: boolean;
  settlementActive?: boolean;
  bothActive: boolean;
  pnlReportFileName?: string;
  returnsFileName?: string;
  settlementFileName?: string;
}

export interface SettlementSummaryMetrics {
  saleOrdersCount: number;
  returnsCount: number;
  ordersSettlement: number;
  protectionFundClaim: number;
  mpFeeRebate: number;
  servicesFees: number;
  taxSettlement: number;
  netBankSettlement: number;
  inputGstTcsCredits: number;
  incomeTaxCredits: number;
  totalRealizableAmount: number;
  rawSummaryRows?: Record<string, any>[];
}

export interface SettlementOrderRecord {
  neftId?: string;
  neftType?: string;
  paymentDate?: string | Date | null;
  bankSettlementValue: number;
  inputGstTcsCredits: number;
  incomeTaxCredits: number;
  orderId: string;
  orderItemId: string;
  saleAmount: number;
  totalOfferAmount: number;
  myShare: number;
  customerAddonsAmount: number;
  marketplaceFee: number;
  taxes: number;
  offerAdjustments: number;
  protectionFund: number;
  refund: number;
  tier?: string;
  commissionRate?: number;
  commission: number;
  fixedFee: number;
  collectionFee: number;
  pickAndPackFee: number;
  shippingFee: number;
  reverseShippingFee: number;
  noCostEmiFeeReimbursement?: number;
  installationFee?: number;
  techVisitFee?: number;
  uninstallationFee?: number;
  customerAddonsRecovery?: number;
  franchiseFee?: number;
  shopsyMarketingFee?: number;
  productCancellationFee?: number;
  tcs: number;
  tds: number;
  gstOnMpFees: number;
  offerDiscountInMpFee?: number;
  itemGstRate?: number;
  discountInMpFees?: number;
  gstOnDiscount?: number;
  totalDiscountInMpFee?: number;
  offerAdjustment?: number;
  deadWeight?: number;
  dimensions?: string;
  volumetricWeight?: number;
  chargeableWeightSource?: string;
  chargeableWeightType?: string;
  chargeableWeightSlab?: string;
  shippingZone?: string;
  orderDate?: string | Date | null;
  dispatchDate?: string | Date | null;
  fulfilmentType?: string;
  sellerSku: string;
  quantity: number;
  productSubCategory?: string;
  additionalInformation?: string;
  returnType?: string;
  shopsyOrder?: string;
  itemReturnStatus?: string;
  invoiceId?: string;
  invoiceDate?: string | Date | null;
  freeShippingOffer?: number;
  nonFreeShippingOffer?: number;
  rawRow?: Record<string, any>;
}

export interface SettlementGstRecord {
  serviceType?: string;
  neftId?: string;
  referenceId?: string;
  recallId?: string;
  warehouseStateCode?: string;
  feeName: string;
  feeAmount: number;
  feeWaiver?: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
}

export interface SettlementAdsRecord {
  neftId?: string;
  paymentDate?: string | Date | null;
  type?: string;
  campaignTransactionId?: string;
  walletRedeem?: number;
  walletRedeemReversal?: number;
  walletTopup?: number;
  walletRefund?: number;
  gstOnAdsFees?: number;
  settlementValue: number;
}

export interface SettlementReportData {
  report: any;
  summary: SettlementSummaryMetrics;
  orders: SettlementOrderRecord[];
  gstDetails: SettlementGstRecord[];
  ads: SettlementAdsRecord[];
}

