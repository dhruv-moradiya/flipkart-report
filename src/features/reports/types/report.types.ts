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
  bothActive: boolean;
  pnlReportFileName?: string;
  returnsFileName?: string;
}
