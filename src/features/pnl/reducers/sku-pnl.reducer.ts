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

    let rtoUnits = r.rtoUnits || 0;
    let rvpUnits = r.rvpUnits || 0;
    let cancelledUnits = r.cancelledUnits || 0;

    // If SKU record has 0 sub-breakdown but has returnedCancelledUnits, derive split from matched order records
    if (rtoUnits === 0 && rvpUnits === 0 && cancelledUnits === 0 && relatedOrders.length > 0) {
      for (const order of relatedOrders) {
        const s = (order.orderStatus || "").toLowerCase();
        const diff = order.returnedCancelledUnits || (order.grossUnits - order.netUnits) || 0;
        if (diff > 0) {
          if (s.includes("rto") || s.includes("courier")) {
            rtoUnits += diff;
          } else if (s.includes("cancel")) {
            cancelledUnits += diff;
          } else {
            rvpUnits += diff;
          }
        }
      }
    }

    return {
      sku: r.sku,
      grossUnits: r.grossUnits,
      returnedCancelledUnits: r.returnedCancelledUnits,
      rtoUnits,
      rvpUnits,
      cancelledUnits,
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
