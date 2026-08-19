import { CostStatus } from "./profit-analytics.types";

export type CostApplyScope = "now" | "selected-period" | "all-history";

export interface SkuCostProfileItem {
  _id?: string;
  sku: string;
  productCostPerUnit: number | null;
  logisticsCostPerUnit: number | null;
  packagingCostPerUnit: number | null;
  otherCostPerUnit: number | null;
  totalSellerCostPerUnit: number | null;
  status: CostStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
  isLatest: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkuCostOverviewItem {
  skuId: string;
  sku: string;
  productName: string;
  productCostPerUnit: number | null;
  logisticsCostPerUnit: number | null;
  packagingCostPerUnit: number | null;
  otherCostPerUnit: number | null;
  totalSellerCostPerUnit: number | null;
  status: CostStatus;
  missingFields: string[];
  lastUpdated: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  profileCount: number;
  notes?: string;
}

export interface SaveSkuCostInput {
  sku: string;
  productCostPerUnit: number | null;
  logisticsCostPerUnit: number | null;
  packagingCostPerUnit: number | null;
  otherCostPerUnit: number | null;
  applyScope: CostApplyScope;
  effectiveFrom?: string | null;
  notes?: string;
}

export interface PnlReportImportItem {
  _id: string;
  userId: string;
  reportType: string;
  fileName: string;
  reportingPeriod: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  uploadedAt: string;
  processedAt?: string;
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  totalRows: number;
  validRows: number;
  skuCount: number;
  orderCount: number;
  returnCount?: number;
  settlementCount?: number;
  summaryMetadata?: Record<string, unknown>;
  financialSummary?: {
    netSales: number;
    totalExpenses: number;
    netEarnings: number;
    amountSettled: number;
    amountPending: number;
    grossUnits: number;
    netUnits: number;
  };
  createdAt: string;
}
