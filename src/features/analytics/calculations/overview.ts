import { PnlReport } from "@/features/reports/models/pnl.models";
import { ReturnRecord } from "@/features/reports/models/returns.models";
import {
  OverviewFinancialMetric,
  GroupedBarDatum,
  SimpleBarDatum,
  PieChartDatum,
} from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Aggregates top-level overview metrics across P&L and Returns
 */
export function getOverviewMetrics(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null
): OverviewFinancialMetric {
  let accountedNetSales = 0;
  let totalExpenses = 0;
  let netEarnings = 0;
  let amountSettled = 0;
  let amountPending = 0;
  let grossUnits = 0;
  let netUnits = 0;
  let returnedCancelledUnits = 0;
  const skuSet = new Set<string>();
  const orderSet = new Set<string>();
  let totalOrderItems = 0;

  if (pnl) {
    pnl.skuLevel.forEach((sku) => {
      accountedNetSales += sku.accountedNetSales || 0;
      totalExpenses += sku.totalExpenses || 0;
      netEarnings += sku.netEarnings || 0;
      amountSettled += sku.amountSettled || 0;
      amountPending += sku.amountPending || 0;
      grossUnits += sku.grossUnits || 0;
      netUnits += sku.netUnits || 0;
      returnedCancelledUnits += sku.returnedCancelledUnits || 0;
      if (sku.sku) skuSet.add(sku.sku);
    });

    pnl.orders.forEach((ord) => {
      if (ord.orderId) orderSet.add(ord.orderId);
      totalOrderItems++;
    });
  } else if (returns && returns.length > 0) {
    returns.forEach((ret) => {
      if (ret.sku) skuSet.add(ret.sku);
      if (ret.orderId) orderSet.add(ret.orderId);
      totalOrderItems++;
      grossUnits += Number(ret.quantity) || 1;
      returnedCancelledUnits += Number(ret.quantity) || 1;
    });
  }

  return {
    accountedNetSales,
    totalExpenses,
    netEarnings,
    amountSettled,
    amountPending,
    grossUnits,
    netUnits,
    returnedCancelledUnits,
    totalOrders: orderSet.size,
    totalOrderItems: totalOrderItems || pnl?.orders.length || returns?.length || 0,
    totalSkus: skuSet.size || pnl?.skuLevel.length || 0,
  };
}

/**
 * Overview Chart: Sales vs Total Expenses vs Net Earnings
 */
export function getOverviewFinancialComparison(pnl?: PnlReport | null): GroupedBarDatum[] {
  if (!pnl) return [];

  let totalSales = 0;
  let totalExpenses = 0;
  let totalEarnings = 0;

  pnl.skuLevel.forEach((s) => {
    totalSales += s.accountedNetSales || 0;
    totalExpenses += Math.abs(s.totalExpenses || 0); // Magnitude for chart comparison
    totalEarnings += s.netEarnings || 0;
  });

  return [
    {
      category: "Overall Performance",
      "Accounted Net Sales": totalSales,
      "Total Expenses (Magnitude)": totalExpenses,
      "Net Earnings": totalEarnings,
    },
  ];
}

/**
 * Overview Chart: Gross vs Returned/Cancelled vs Net Units
 */
export function getOverviewUnitsComparison(pnl?: PnlReport | null, returns?: ReturnRecord[] | null): SimpleBarDatum[] {
  const metrics = getOverviewMetrics(pnl, returns);

  return [
    {
      label: "Gross Units Ordered",
      value: metrics.grossUnits,
      formattedValue: `${metrics.grossUnits.toLocaleString()} units`,
      fill: "var(--chart-1)",
    },
    {
      label: "Returned & Cancelled",
      value: metrics.returnedCancelledUnits,
      formattedValue: `${metrics.returnedCancelledUnits.toLocaleString()} units`,
      fill: "var(--chart-5)",
    },
    {
      label: "Net Delivered Units",
      value: metrics.netUnits,
      formattedValue: `${metrics.netUnits.toLocaleString()} units`,
      fill: "var(--chart-2)",
    },
  ];
}

/**
 * Overview Chart: Order Status Distribution (From Orders P&L)
 */
export function getOrdersStatusDistribution(pnl?: PnlReport | null): SimpleBarDatum[] {
  if (!pnl || !pnl.orders || pnl.orders.length === 0) return [];

  const statusMap = new Map<string, number>();

  pnl.orders.forEach((ord) => {
    const status = ord.orderStatus?.trim() || "Unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return Array.from(statusMap.entries())
    .map(([status, count], idx) => ({
      label: status,
      value: count,
      formattedValue: `${count.toLocaleString()} items`,
      fill: palette[idx % palette.length],
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Overview Chart: Fulfillment Type Distribution
 */
export function getFulfillmentDistribution(pnl?: PnlReport | null): PieChartDatum[] {
  if (!pnl || !pnl.orders || pnl.orders.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  pnl.orders.forEach((ord) => {
    const ff = ord.fulfillmentType?.trim() || "Standard / Non-FA";
    map.set(ff, (map.get(ff) || 0) + 1);
    total++;
  });

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
  ];

  return Array.from(map.entries())
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      fill: palette[idx % palette.length],
    }))
    .sort((a, b) => b.value - a.value);
}
