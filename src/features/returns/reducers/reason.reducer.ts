import { ReturnRecord } from "../types/return.types";
import { ReasonAnalytics, ReasonMetric } from "../types/analytics.types";

/**
 * Calculates Return Reason analytics
 *
 * Source Column: Return Reason
 */
export function calculateReasonAnalytics(returns: ReturnRecord[]): ReasonAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      topReasons: [],
      allReasons: [],
      totalReasonsCount: 0,
    };
  }

  const map: Record<string, { count: number; totalValue: number }> = {};

  returns.forEach((r) => {
    const reason = r.returnReason.trim() || "Unspecified Reason";
    if (!map[reason]) {
      map[reason] = { count: 0, totalValue: 0 };
    }
    map[reason].count += 1;
    map[reason].totalValue += r.totalPrice;
  });

  const allReasons: ReasonMetric[] = Object.entries(map).map(([reason, data]) => ({
    reason,
    count: data.count,
    percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
    totalValue: data.totalValue,
  })).sort((a, b) => b.count - a.count);

  return {
    topReasons: allReasons.slice(0, 10),
    allReasons,
    totalReasonsCount: allReasons.length,
  };
}
