import { SkuPnlRecord, OrderPnlRecord } from "../types/pnl.types";
import { SkuPnlAnalytics, SkuPnlRankings } from "../types/pnl-analytics.types";

/**
 * Calculates per-SKU performance and rankings, joining related orders
 */
export function calculateSkuPnlAnalytics(
  skuRecords: SkuPnlRecord[],
  ordersBySkuMap: Record<string, OrderPnlRecord[]> = {}
): SkuPnlRankings {
  const allSkus: SkuPnlAnalytics[] = skuRecords.map((r) => {
    const returnRate =
      r.grossUnits > 0
        ? Number(((r.returnedCancelledUnits / r.grossUnits) * 100).toFixed(1))
        : 0;

    const relatedOrders = ordersBySkuMap[r.sku.toLowerCase().trim()] || [];

    return {
      sku: r.sku,
      grossUnits: r.grossUnits,
      returnedCancelledUnits: r.returnedCancelledUnits,
      netUnits: r.netUnits,
      returnRate,
      sales: r.estimatedNetSales,
      accountedSales: r.accountedNetSales,
      orderItemValue: r.orderItemValue,
      expenses: r.totalExpenses,
      rewards: r.rewards,
      earnings: r.netEarnings,
      earningsPerUnit: r.earningsPerUnit,
      settledAmount: r.amountSettled,
      pendingAmount: r.amountPending,
      relatedOrdersCount: relatedOrders.length,
      relatedOrders,
    };
  });

  const topBySales = [...allSkus].sort((a, b) => b.sales - a.sales).slice(0, 10);
  const topByEarnings = [...allSkus].sort((a, b) => b.earnings - a.earnings).slice(0, 10);
  const topByExpenses = [...allSkus].sort((a, b) => b.expenses - a.expenses).slice(0, 10);
  const topByReturns = [...allSkus].sort((a, b) => b.returnedCancelledUnits - a.returnedCancelledUnits).slice(0, 10);
  const topByUnitsSold = [...allSkus].sort((a, b) => b.grossUnits - a.grossUnits).slice(0, 10);
  const topByPending = [...allSkus].sort((a, b) => b.pendingAmount - a.pendingAmount).slice(0, 10);

  return {
    allSkus,
    topBySales,
    topByEarnings,
    topByExpenses,
    topByReturns,
    topByUnitsSold,
    topByPending,
  };
}
