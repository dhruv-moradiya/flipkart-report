import { ReturnRecord } from "../types/return.types";
import { CompletionStatusAnalytics, CompletionStatusMetric } from "../types/analytics.types";
import { COMPLETION_STATUS_LABELS } from "../constants/return.constants";

/**
 * Calculates Completion Status analytics
 *
 * Source Column: Completion Status ONLY
 * Expected values: Open, Closed, etc.
 */
export function calculateCompletionAnalytics(returns: ReturnRecord[]): CompletionStatusAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      openReturns: 0,
      completedReturns: 0,
      total: 0,
      items: [],
    };
  }

  const map: Record<string, number> = {};
  let openReturns = 0;
  let completedReturns = 0;

  returns.forEach((r) => {
    const raw = r.completionStatus.toLowerCase().trim() || "unknown";

    if (raw === "open") {
      openReturns++;
    } else if (raw === "closed" || raw === "completed") {
      completedReturns++;
    }

    map[raw] = (map[raw] || 0) + 1;
  });

  const items: CompletionStatusMetric[] = Object.entries(map).map(([st, count]) => ({
    status: st,
    label: COMPLETION_STATUS_LABELS[st] || st.charAt(0).toUpperCase() + st.slice(1),
    count,
    percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.count - a.count);

  return {
    openReturns,
    completedReturns,
    total,
    items,
  };
}
