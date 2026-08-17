import { ReturnRecord } from "../types/return.types";
import { ReturnStatusAnalytics, ReturnStatusMetric } from "../types/analytics.types";
import { formatReturnStatus } from "../constants/return.constants";

/**
 * Calculates Return Status analytics
 *
 * Source Column: Return Status ONLY
 * Expected values: in_transit, start
 */
export function calculateStatusAnalytics(returns: ReturnRecord[]): ReturnStatusAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      inTransit: 0,
      start: 0,
      total: 0,
      items: [],
    };
  }

  const statusMap: Record<string, { count: number; totalValue: number }> = {};
  let inTransit = 0;
  let start = 0;

  returns.forEach((r) => {
    const rawStatus = r.returnStatus.toLowerCase().trim() || "unknown";

    if (rawStatus === "in_transit") {
      inTransit++;
    } else if (rawStatus === "start") {
      start++;
    }

    if (!statusMap[rawStatus]) {
      statusMap[rawStatus] = { count: 0, totalValue: 0 };
    }
    statusMap[rawStatus].count += 1;
    statusMap[rawStatus].totalValue += r.totalPrice;
  });

  const items: ReturnStatusMetric[] = Object.entries(statusMap).map(([status, data]) => ({
    status,
    label: formatReturnStatus(status),
    count: data.count,
    percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
    totalValue: data.totalValue,
  })).sort((a, b) => b.count - a.count);

  return {
    inTransit,
    start,
    total,
    items,
  };
}
