import { PnlReport, OrderPnlRecord } from "@/features/reports/models/pnl.models";
import { SimpleBarDatum, PieChartDatum, TimeSeriesDatum } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";
import { formatDate } from "@/features/reports/excel/date-parser";

/**
 * Projected Settlement vs Amount Settled vs Amount Pending
 */
export function getSettlementComparison(pnl?: PnlReport | null): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let projected = 0;
  let settled = 0;
  let pending = 0;

  pnl.skuLevel.forEach((s) => {
    projected += s.bankSettlement || 0;
    settled += s.amountSettled || 0;
    pending += s.amountPending || 0;
  });

  return [
    {
      label: "Bank Settlement [Projected]",
      value: projected,
      formattedValue: formatINR(projected),
      fill: "var(--chart-1)",
    },
    {
      label: "Amount Settled",
      value: settled,
      formattedValue: formatINR(settled),
      fill: "var(--chart-2)",
    },
    {
      label: "Amount Pending",
      value: pending,
      formattedValue: formatINR(pending),
      fill: "var(--chart-5)",
    },
  ];
}

/**
 * Settlement Transactions Grouped by Status
 */
export function getTransactionsByStatus(orders: OrderPnlRecord[]): PieChartDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  orders.forEach((o) => {
    (o.transactions || []).forEach((t) => {
      const st = t.currentStatus?.trim() || "Settled";
      map.set(st, (map.get(st) || 0) + 1);
      total++;
    });
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-5)", "var(--chart-4)"];

  return Array.from(map.entries()).map(([name, value], idx) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
    fill: palette[idx % palette.length],
  }));
}

/**
 * Settlement Transaction Amount Grouped by Reason
 */
export function getTransactionAmountByReason(orders: OrderPnlRecord[]): SimpleBarDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();

  orders.forEach((o) => {
    (o.transactions || []).forEach((t) => {
      const reason = t.reason?.trim() || "Order Settlement";
      map.set(reason, (map.get(reason) || 0) + (t.transactionAmount || 0));
    });
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      formattedValue: formatINR(value),
      fill: palette[idx % palette.length],
    }));
}

/**
 * Settlement Payout Amount Timeline by Payment Date
 */
export function getSettlementTimeline(orders: OrderPnlRecord[]): TimeSeriesDatum[] {
  if (!orders || orders.length === 0) return [];

  const dateMap = new Map<string, number>();

  orders.forEach((o) => {
    (o.transactions || []).forEach((t) => {
      if (t.paymentDate) {
        const d = formatDate(t.paymentDate);
        if (d && d !== "—") {
          dateMap.set(d, (dateMap.get(d) || 0) + (t.transactionAmount || 0));
        }
      }
    });
  });

  return Array.from(dateMap.entries())
    .map(([date, value]) => ({
      date,
      value,
      label: `${date}: ${formatINR(value)}`,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
