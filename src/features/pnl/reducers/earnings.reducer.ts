import { SkuPnlRecord } from "../types/pnl.types";
import { EarningsAnalytics } from "../types/pnl-analytics.types";

/**
 * Calculates net earnings profitability breakdown
 */
export function calculateEarningsAnalytics(skuRecords: SkuPnlRecord[]): EarningsAnalytics {
  let totalNetEarnings = 0;
  let totalNetUnits = 0;
  let profitableSkusCount = 0;
  let lossMakingSkusCount = 0;

  let highestEarningSku: { sku: string; earnings: number } | null = null;
  let lowestEarningSku: { sku: string; earnings: number } | null = null;

  skuRecords.forEach((r) => {
    totalNetEarnings += r.netEarnings;
    totalNetUnits += r.netUnits;

    if (r.netEarnings > 0) {
      profitableSkusCount++;
    } else if (r.netEarnings < 0) {
      lossMakingSkusCount++;
    }

    if (!highestEarningSku || r.netEarnings > highestEarningSku.earnings) {
      highestEarningSku = { sku: r.sku, earnings: r.netEarnings };
    }
    if (!lowestEarningSku || r.netEarnings < lowestEarningSku.earnings) {
      lowestEarningSku = { sku: r.sku, earnings: r.netEarnings };
    }
  });

  const averageEarningsPerUnit =
    totalNetUnits > 0 ? Number((totalNetEarnings / totalNetUnits).toFixed(2)) : 0;

  return {
    totalNetEarnings,
    averageEarningsPerUnit,
    profitableSkusCount,
    lossMakingSkusCount,
    highestEarningSku,
    lowestEarningSku,
  };
}
