export type FinancialBasis = "netEarnings" | "settlementAmount";
export type UnitBasis = "netUnits" | "grossUnits";
export type ProfitabilityStatus =
  | "PROFITABLE"
  | "BREAK_EVEN"
  | "LOSS"
  | "INCOMPLETE_COST"
  | "MISSING_COST";

export type CostStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export interface PeriodInfo {
  reportingPeriod: string; // e.g. "2026-08"
  periodLabel: string; // e.g. "August 2026"
  periodStart?: string;
  periodEnd?: string;
}

export interface BusinessProfitOverviewTotals {
  totalEstimatedNetSales: number;
  totalFinancialAmount: number;
  totalUnits: number;
  totalProductCost: number | null;
  totalLogisticsCost: number | null;
  totalPackagingCost: number | null;
  totalOtherCost: number | null;
  totalSellerCost: number | null;
  totalActualProfit: number | null;
  averageProfitPerUnit: number | null;
  overallProfitMargin: number | null;
}

export interface BusinessProfitOverviewCounts {
  totalSkus: number;
  profitableSkus: number;
  lossSkus: number;
  breakEvenSkus: number;
  missingCostSkus: number;
  partialCostSkus: number;
}

export interface MonthlyTrendItem {
  reportingPeriod: string;
  periodLabel: string;
  financialAmount: number;
  sellerCost: number | null;
  actualProfit: number | null;
  units: number;
  margin: number | null;
}

export interface SkuProfitRow {
  snapshotId?: string;
  sku: string;
  productName: string;
  units: number;
  financialAmount: number;
  estimatedNetSales: number;
  totalSellerCost: number | null;
  actualProfit: number | null;
  profitPerUnit: number | null;
  profitMargin: number | null;
  costStatus: CostStatus;
  profitabilityStatus: ProfitabilityStatus;
  missingCostFields: string[];
  costBreakdown: {
    product: number | null;
    logistics: number | null;
    packaging: number | null;
    other: number | null;
    totalPerUnit: number | null;
  };
}

export interface BusinessProfitOverviewData {
  periodsIncluded: PeriodInfo[];
  financialBasis: FinancialBasis;
  unitBasis: UnitBasis;
  totals: BusinessProfitOverviewTotals;
  counts: BusinessProfitOverviewCounts;
  monthlyTrend: MonthlyTrendItem[];
  skuTable: SkuProfitRow[];
}

export interface MonthlySkuHistoryRow {
  snapshotId: string;
  reportingPeriod: string;
  periodLabel: string;
  units: number;
  financialAmount: number;
  productCostPerUnit: number | null;
  logisticsCostPerUnit: number | null;
  packagingCostPerUnit: number | null;
  otherCostPerUnit: number | null;
  totalSellerCostPerUnit: number | null;
  totalProductCost: number | null;
  totalLogisticsCost: number | null;
  totalPackagingCost: number | null;
  totalOtherCost: number | null;
  totalSellerCost: number | null;
  actualProfit: number | null;
  profitPerUnit: number | null;
  profitMargin: number | null;
  costStatus: CostStatus;
  profitabilityStatus: ProfitabilityStatus;
  missingCostFields: string[];
  calculatedAt: string;
}

export interface SkuPerformanceData {
  sku: string;
  productName: string;
  financialBasis: FinancialBasis;
  unitBasis: UnitBasis;
  currentCostProfile: {
    productCostPerUnit: number | null;
    logisticsCostPerUnit: number | null;
    packagingCostPerUnit: number | null;
    otherCostPerUnit: number | null;
    totalSellerCostPerUnit: number | null;
    notes?: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
  };
  costProfilesHistory: {
    id: string;
    productCostPerUnit: number | null;
    logisticsCostPerUnit: number | null;
    packagingCostPerUnit: number | null;
    otherCostPerUnit: number | null;
    totalSellerCostPerUnit: number | null;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    isCurrent: boolean;
    notes?: string;
    createdAt: string;
  }[];
  summary: BusinessProfitOverviewTotals;
  monthlyHistory: MonthlySkuHistoryRow[];
}

export interface SkuPeriodComparison {
  sku: string;
  productName: string;
  periodA: {
    units: number;
    payout: number;
    sellerCost: number | null;
    actualProfit: number | null;
    profitMargin: number | null;
    status: ProfitabilityStatus;
  };
  periodB: {
    units: number;
    payout: number;
    sellerCost: number | null;
    actualProfit: number | null;
    profitMargin: number | null;
    status: ProfitabilityStatus;
  };
  changes: {
    unitsChange: number;
    unitsChangePct: number | null;
    payoutChange: number;
    payoutChangePct: number | null;
    costChange: number | null;
    costChangePct: number | null;
    profitChange: number | null;
    profitChangePct: number | null;
    marginChange: number | null;
  };
}

export interface PeriodComparisonData {
  periodA: string;
  periodB: string;
  financialBasis: FinancialBasis;
  unitBasis: UnitBasis;
  aggregate: {
    periodA: {
      units: number;
      payout: number;
      sellerCost: number;
      actualProfit: number;
      margin: number;
    };
    periodB: {
      units: number;
      payout: number;
      sellerCost: number;
      actualProfit: number;
      margin: number;
    };
    changes: {
      unitsChange: number;
      unitsChangePct: number | null;
      payoutChange: number;
      payoutChangePct: number | null;
      costChange: number | null;
      costChangePct: number | null;
      profitChange: number | null;
      profitChangePct: number | null;
      marginChange: number | null;
    };
  };
  skuComparisons: SkuPeriodComparison[];
}

export interface SnapshotDrilldownData {
  snapshot: MonthlySkuHistoryRow & {
    sku: string;
    periodLabel: string;
    applicableUnits: number;
  };
  imports: Array<{
    _id: string;
    fileName: string;
    periodLabel: string;
    uploadedAt: string;
    skuCount: number;
    orderCount: number;
  }>;
  costProfile: {
    productCostPerUnit: number | null;
    logisticsCostPerUnit: number | null;
    packagingCostPerUnit: number | null;
    otherCostPerUnit: number | null;
    totalSellerCostPerUnit: number | null;
    status: CostStatus;
  } | null;
  sampleOrders: Array<{
    _id?: string;
    orderId: string;
    orderItemId?: string;
    orderStatus?: string;
    netUnits: number;
    netEarnings?: number;
    reportImportId?: string;
  }>;
  explanation: {
    financialBasis: string;
    financialAmount: number;
    unitBasis: string;
    applicableUnits: number;
    mathFormula: {
      productCost: string;
      logisticsCost: string;
      packagingCost: string;
      otherCost: string;
      totalSellerCost: string;
      actualProfit: string;
    };
  };
}
