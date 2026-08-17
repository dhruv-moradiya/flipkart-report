import { PnlReport } from "../types/pnl.types";
import { PnlAnalytics } from "../types/pnl-analytics.types";
import { calculatePnlOverview } from "./pnl-overview.reducer";
import { calculateOrdersPnlAnalytics } from "./orders-pnl.reducer";
import { calculateSkuPnlAnalytics } from "./sku-pnl.reducer";
import { calculateSettlementAnalytics } from "./settlement.reducer";
import { calculateEarningsAnalytics } from "./earnings.reducer";

/**
 * Master P&L Analytics Reducer
 * Pure function: takes a PnlReport and calculates complete domain analytics
 */
export function buildPnlAnalytics(report: PnlReport): PnlAnalytics {
  const orders = calculateOrdersPnlAnalytics(report.orders);
  const skus = calculateSkuPnlAnalytics(report.skuLevel, orders.ordersBySkuMap);
  const overview = calculatePnlOverview(report.skuLevel);
  const settlement = calculateSettlementAnalytics(report.skuLevel);
  const earnings = calculateEarningsAnalytics(report.skuLevel);

  return {
    overview,
    skus,
    orders,
    settlement,
    earnings,
    rawReport: {
      fileName: report.fileName,
      skuSheetName: report.skuSheetName,
      ordersSheetName: report.ordersSheetName,
      parsedAt: report.parsedAt,
    },
  };
}
