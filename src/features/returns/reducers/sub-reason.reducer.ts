import { ReturnRecord } from "../types/return.types";
import { SubReasonAnalytics, ReasonWithSubReasons } from "../types/analytics.types";

/**
 * Calculates Return Sub-Reason hierarchy breakdown
 *
 * Source Columns: Return Reason -> Return Sub-reason
 */
export function calculateSubReasonAnalytics(returns: ReturnRecord[]): SubReasonAnalytics {
  if (returns.length === 0) {
    return { byParentReason: [] };
  }

  const hierarchy: Record<string, { totalCount: number; subReasons: Record<string, number> }> = {};

  returns.forEach((r) => {
    const parent = r.returnReason.trim() || "Unspecified Reason";
    const sub = r.returnSubReason.trim() || "Unspecified Sub-reason";

    if (!hierarchy[parent]) {
      hierarchy[parent] = { totalCount: 0, subReasons: {} };
    }
    hierarchy[parent].totalCount += 1;
    hierarchy[parent].subReasons[sub] = (hierarchy[parent].subReasons[sub] || 0) + 1;
  });

  const byParentReason: ReasonWithSubReasons[] = Object.entries(hierarchy).map(([reason, data]) => {
    const subReasons = Object.entries(data.subReasons).map(([subReason, count]) => ({
      subReason,
      count,
      percentage: data.totalCount > 0 ? Number(((count / data.totalCount) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.count - a.count);

    return {
      reason,
      count: data.totalCount,
      subReasons,
    };
  }).sort((a, b) => b.count - a.count);

  return {
    byParentReason,
  };
}
