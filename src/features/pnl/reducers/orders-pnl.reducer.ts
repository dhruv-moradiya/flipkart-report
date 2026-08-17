import { OrderPnlRecord } from "../types/pnl.types";
import { OrdersPnlAnalytics, OrderStatusMetric } from "../types/pnl-analytics.types";

/**
 * Calculates Order-level metrics and builds the SKU ↔ Order lookup map
 */
export function calculateOrdersPnlAnalytics(orderRecords: OrderPnlRecord[]): OrdersPnlAnalytics {
  const totalOrderItems = orderRecords.length;

  if (totalOrderItems === 0) {
    return {
      totalOrders: 0,
      totalOrderItems: 0,
      totalOrderItemValue: 0,
      totalFinalSellingPrice: 0,
      returnedCancelledCount: 0,
      netOrderItemsCount: 0,
      ordersByStatus: [],
      ordersBySkuMap: {},
    };
  }

  const orderSet = new Set<string>();
  const statusMap: Record<string, { count: number; totalValue: number }> = {};
  const ordersBySkuMap: Record<string, OrderPnlRecord[]> = {};

  let totalOrderItemValue = 0;
  let totalFinalSellingPrice = 0;
  let returnedCancelledCount = 0;
  let netOrderItemsCount = 0;

  orderRecords.forEach((r) => {
    if (r.orderId) orderSet.add(r.orderId);

    totalOrderItemValue += r.orderItemValue;
    totalFinalSellingPrice += r.finalSellingPrice;

    if (r.returnedCancelledUnits > 0) {
      returnedCancelledCount += r.returnedCancelledUnits;
    }
    netOrderItemsCount += r.netUnits;

    // Status breakdown
    const status = r.orderStatus.trim() || "Completed";
    if (!statusMap[status]) {
      statusMap[status] = { count: 0, totalValue: 0 };
    }
    statusMap[status].count += 1;
    statusMap[status].totalValue += r.finalSellingPrice;

    // Index by SKU for fast lookup
    if (r.sku) {
      const skuKey = r.sku.toLowerCase().trim();
      if (!ordersBySkuMap[skuKey]) {
        ordersBySkuMap[skuKey] = [];
      }
      ordersBySkuMap[skuKey].push(r);
    }
  });

  const ordersByStatus: OrderStatusMetric[] = Object.entries(statusMap).map(([status, data]) => ({
    status,
    count: data.count,
    percentage: totalOrderItems > 0 ? Number(((data.count / totalOrderItems) * 100).toFixed(1)) : 0,
    totalValue: data.totalValue,
  })).sort((a, b) => b.count - a.count);

  return {
    totalOrders: orderSet.size,
    totalOrderItems,
    totalOrderItemValue,
    totalFinalSellingPrice,
    returnedCancelledCount,
    netOrderItemsCount,
    ordersByStatus,
    ordersBySkuMap,
  };
}
