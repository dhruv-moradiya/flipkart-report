import { SkuPnlRecord, OrderPnlRecord } from "./pnl.types";

export interface PnlOverviewAnalytics {
  totalSkus: number;
  totalGrossUnits: number;
  totalReturnedCancelledUnits: number;
  totalNetUnits: number;
  overallReturnRate: number; // percentage (returnedCancelled / gross * 100)

  totalEstimatedNetSales: number;
  totalAccountedNetSales: number;
  totalOrderItemValue: number;

  totalExpenses: number;
  totalRewards: number;
  totalBankSettlement: number;
  totalInputTaxCredits: number;

  totalNetEarnings: number;
  averageEarningsPerUnit: number;

  totalAmountSettled: number;
  totalAmountPending: number;
}

export interface SkuPnlAnalytics {
  sku: string;

  grossUnits: number;
  returnedCancelledUnits: number;
  rtoUnits?: number;
  rvpUnits?: number;
  cancelledUnits?: number;
  netUnits: number;
  returnRate: number;

  sales: number; // estimatedNetSales
  accountedSales: number;
  orderItemValue: number;
  expenses: number;
  rewards: number;
  earnings: number; // netEarnings
  earningsPerUnit: number;

  settledAmount: number;
  pendingAmount: number;

  relatedOrdersCount: number;
  relatedOrders: OrderPnlRecord[];
}

export interface SkuPnlRankings {
  allSkus: SkuPnlAnalytics[];
  topBySales: SkuPnlAnalytics[];
  topByEarnings: SkuPnlAnalytics[];
  topByExpenses: SkuPnlAnalytics[];
  topByReturns: SkuPnlAnalytics[];
  topByUnitsSold: SkuPnlAnalytics[];
  topByPending: SkuPnlAnalytics[];
}

export interface OrderStatusMetric {
  status: string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface OrdersPnlAnalytics {
  totalOrders: number;
  totalOrderItems: number;
  totalOrderItemValue: number;
  totalFinalSellingPrice: number;
  returnedCancelledCount: number;
  netOrderItemsCount: number;
  ordersByStatus: OrderStatusMetric[];
  ordersBySkuMap: Record<string, OrderPnlRecord[]>;
}

export interface SettlementAnalytics {
  totalAmountSettled: number;
  totalAmountPending: number;
  settledPercentage: number;
  pendingPercentage: number;
  bankSettlementTotal: number;
}

export interface EarningsAnalytics {
  totalNetEarnings: number;
  averageEarningsPerUnit: number;
  profitableSkusCount: number;
  lossMakingSkusCount: number;
  highestEarningSku: { sku: string; earnings: number } | null;
  lowestEarningSku: { sku: string; earnings: number } | null;
}

export interface PnlAnalytics {
  overview: PnlOverviewAnalytics;
  skus: SkuPnlRankings;
  orders: OrdersPnlAnalytics;
  settlement: SettlementAnalytics;
  earnings: EarningsAnalytics;
  rawReport: {
    fileName: string;
    skuSheetName: string;
    ordersSheetName: string;
    parsedAt: string;
  };
}
