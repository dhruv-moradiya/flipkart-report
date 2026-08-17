import { ReturnRecord } from "../types/return.types";
import { ReturnTypeAnalytics, ReturnTypeMetric } from "../types/analytics.types";
import { formatReturnType } from "../constants/return.constants";

/**
 * Calculates Return Type analytics
 *
 * Source Column: Return Type ONLY
 * Expected values: customer_return, courier_return
 */
export function calculateReturnTypeAnalytics(returns: ReturnRecord[]): ReturnTypeAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      customerReturns: 0,
      courierReturns: 0,
      total: 0,
      items: [],
    };
  }

  const typeMap: Record<string, { count: number; totalValue: number }> = {};
  let customerReturns = 0;
  let courierReturns = 0;

  returns.forEach((r) => {
    const rawType = r.returnType.toLowerCase().trim() || "unknown";

    if (rawType === "customer_return") {
      customerReturns++;
    } else if (rawType === "courier_return") {
      courierReturns++;
    }

    if (!typeMap[rawType]) {
      typeMap[rawType] = { count: 0, totalValue: 0 };
    }
    typeMap[rawType].count += 1;
    typeMap[rawType].totalValue += r.totalPrice;
  });

  const items: ReturnTypeMetric[] = Object.entries(typeMap).map(([type, data]) => ({
    type,
    label: formatReturnType(type),
    count: data.count,
    percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
    totalValue: data.totalValue,
  })).sort((a, b) => b.count - a.count);

  return {
    customerReturns,
    courierReturns,
    total,
    items,
  };
}
