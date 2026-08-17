import { ReturnRecord } from "../types/return.types";
import { OverviewAnalytics } from "../types/analytics.types";

/**
 * Calculates high-level overview KPIs
 *
 * Source Columns:
 * - totalReturns: Return ID (count of rows)
 * - uniqueOrders: Order ID (unique set)
 * - uniqueSkus: SKU (unique set)
 * - totalQuantity: Quantity (sum)
 * - totalReturnValue: Total Price (sum)
 */
export function calculateOverview(returns: ReturnRecord[]): OverviewAnalytics {
  const totalReturns = returns.length;

  if (totalReturns === 0) {
    return {
      totalReturns: 0,
      uniqueOrders: 0,
      uniqueSkus: 0,
      totalQuantity: 0,
      totalReturnValue: 0,
      averageReturnValue: 0,
    };
  }

  const orderSet = new Set<string>();
  const skuSet = new Set<string>();
  let totalQuantity = 0;
  let totalReturnValue = 0;

  returns.forEach((r) => {
    if (r.orderId) orderSet.add(r.orderId);
    if (r.sku) skuSet.add(r.sku);
    totalQuantity += r.quantity;
    totalReturnValue += r.totalPrice;
  });

  return {
    totalReturns,
    uniqueOrders: orderSet.size,
    uniqueSkus: skuSet.size,
    totalQuantity,
    totalReturnValue,
    averageReturnValue: totalReturns > 0 ? totalReturnValue / totalReturns : 0,
  };
}
