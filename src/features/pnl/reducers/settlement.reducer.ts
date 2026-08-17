import { SkuPnlRecord } from "../types/pnl.types";
import { SettlementAnalytics } from "../types/pnl-analytics.types";

/**
 * Calculates Bank Settlement and Pending Settlement metrics
 */
export function calculateSettlementAnalytics(skuRecords: SkuPnlRecord[]): SettlementAnalytics {
  let totalAmountSettled = 0;
  let totalAmountPending = 0;
  let bankSettlementTotal = 0;

  skuRecords.forEach((r) => {
    totalAmountSettled += r.amountSettled;
    totalAmountPending += r.amountPending;
    bankSettlementTotal += r.bankSettlement;
  });

  const combined = totalAmountSettled + totalAmountPending;
  const settledPercentage = combined > 0 ? Number(((totalAmountSettled / combined) * 100).toFixed(1)) : 0;
  const pendingPercentage = combined > 0 ? Number(((totalAmountPending / combined) * 100).toFixed(1)) : 0;

  return {
    totalAmountSettled,
    totalAmountPending,
    settledPercentage,
    pendingPercentage,
    bankSettlementTotal,
  };
}
