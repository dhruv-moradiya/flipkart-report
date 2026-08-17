import { ReturnRecord } from "../types/return.types";
import { AgingAnalytics, AgingBucket } from "../types/analytics.types";

/**
 * Calculates Return Aging & Turnaround analytics
 *
 * Source Columns:
 * - Return Requested Date
 * - Return Delivery Promise Date
 * - Picked Up Date
 * - Completed Date
 * - Completion Status
 */
export function calculateAgingAnalytics(returns: ReturnRecord[], referenceDate = new Date()): AgingAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      averagePendingDays: 0,
      overdueCount: 0,
      overduePercentage: 0,
      buckets: [],
    };
  }

  let totalPendingDays = 0;
  let openReturnsCount = 0;
  let overdueCount = 0;

  const bucketCounts = {
    "0-7 days": 0,
    "8-15 days": 0,
    "16-30 days": 0,
    "30+ days": 0,
  };

  returns.forEach((r) => {
    const isOpen = r.completionStatus.toLowerCase().trim() === "open";

    if (r.returnRequestedDate) {
      const ageMs = referenceDate.getTime() - r.returnRequestedDate.getTime();
      const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

      if (isOpen) {
        openReturnsCount++;
        totalPendingDays += ageDays;

        if (ageDays <= 7) bucketCounts["0-7 days"]++;
        else if (ageDays <= 15) bucketCounts["8-15 days"]++;
        else if (ageDays <= 30) bucketCounts["16-30 days"]++;
        else bucketCounts["30+ days"]++;
      }
    }

    // Overdue check: Open AND referenceDate > Return Delivery Promise Date
    if (isOpen && r.returnDeliveryPromiseDate) {
      if (referenceDate.getTime() > r.returnDeliveryPromiseDate.getTime()) {
        overdueCount++;
      }
    }
  });

  const buckets: AgingBucket[] = Object.entries(bucketCounts).map(([label, count]) => ({
    label,
    count,
    percentage: openReturnsCount > 0 ? Number(((count / openReturnsCount) * 100).toFixed(1)) : 0,
  }));

  return {
    averagePendingDays: openReturnsCount > 0 ? Math.round(totalPendingDays / openReturnsCount) : 0,
    overdueCount,
    overduePercentage: openReturnsCount > 0 ? Number(((overdueCount / openReturnsCount) * 100).toFixed(1)) : 0,
    buckets,
  };
}
