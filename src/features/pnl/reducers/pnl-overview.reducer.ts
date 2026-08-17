import { SkuPnlRecord } from "../types/pnl.types";
import { PnlOverviewAnalytics } from "../types/pnl-analytics.types";

/**
 * Calculates high-level P&L overview metrics
 *
 * Source: SKU-level P&L sheet as primary source of truth
 */
export function calculatePnlOverview(skuRecords: SkuPnlRecord[]): PnlOverviewAnalytics {
  const totalSkus = skuRecords.length;

  if (totalSkus === 0) {
    return {
      totalSkus: 0,
      totalGrossUnits: 0,
      totalReturnedCancelledUnits: 0,
      totalNetUnits: 0,
      overallReturnRate: 0,
      totalEstimatedNetSales: 0,
      totalAccountedNetSales: 0,
      totalOrderItemValue: 0,
      totalExpenses: 0,
      totalRewards: 0,
      totalBankSettlement: 0,
      totalInputTaxCredits: 0,
      totalNetEarnings: 0,
      averageEarningsPerUnit: 0,
      totalAmountSettled: 0,
      totalAmountPending: 0,
    };
  }

  let totalGrossUnits = 0;
  let totalReturnedCancelledUnits = 0;
  let totalNetUnits = 0;

  let totalEstimatedNetSales = 0;
  let totalAccountedNetSales = 0;
  let totalOrderItemValue = 0;

  let totalExpenses = 0;
  let totalRewards = 0;
  let totalBankSettlement = 0;
  let totalInputTaxCredits = 0;

  let totalNetEarnings = 0;
  let totalAmountSettled = 0;
  let totalAmountPending = 0;

  skuRecords.forEach((r) => {
    totalGrossUnits += r.grossUnits;
    totalReturnedCancelledUnits += r.returnedCancelledUnits;
    totalNetUnits += r.netUnits;

    totalEstimatedNetSales += r.estimatedNetSales;
    totalAccountedNetSales += r.accountedNetSales;
    totalOrderItemValue += r.orderItemValue;

    totalExpenses += r.totalExpenses;
    totalRewards += r.rewards;
    totalBankSettlement += r.bankSettlement;
    totalInputTaxCredits += r.inputTaxCredits;

    totalNetEarnings += r.netEarnings;
    totalAmountSettled += r.amountSettled;
    totalAmountPending += r.amountPending;
  });

  const overallReturnRate =
    totalGrossUnits > 0
      ? Number(((totalReturnedCancelledUnits / totalGrossUnits) * 100).toFixed(1))
      : 0;

  const averageEarningsPerUnit =
    totalNetUnits > 0 ? Number((totalNetEarnings / totalNetUnits).toFixed(2)) : 0;

  return {
    totalSkus,
    totalGrossUnits,
    totalReturnedCancelledUnits,
    totalNetUnits,
    overallReturnRate,
    totalEstimatedNetSales,
    totalAccountedNetSales,
    totalOrderItemValue,
    totalExpenses,
    totalRewards,
    totalBankSettlement,
    totalInputTaxCredits,
    totalNetEarnings,
    averageEarningsPerUnit,
    totalAmountSettled,
    totalAmountPending,
  };
}
