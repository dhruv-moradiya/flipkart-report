import { OrderPnlRecord } from "@/features/reports/models/pnl.models";
import { SimpleBarDatum, PieChartDatum, TopNCount } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Orders Grouped by Status
 */
export function getOrdersByStatus(orders: OrderPnlRecord[]): SimpleBarDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  orders.forEach((o) => {
    const status = o.orderStatus?.trim() || "Unknown";
    map.set(status, (map.get(status) || 0) + 1);
  });

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} items`,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Orders Grouped by Fulfillment Type
 */
export function getOrdersByFulfillmentType(orders: OrderPnlRecord[]): PieChartDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  orders.forEach((o) => {
    const ff = o.fulfillmentType?.trim() || "Standard Fulfillment";
    map.set(ff, (map.get(ff) || 0) + 1);
    total++;
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Orders Grouped by Payment Mode (Prepaid vs COD)
 */
export function getOrdersByPaymentMode(orders: OrderPnlRecord[]): PieChartDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  orders.forEach((o) => {
    const mode = o.modeOfPayment?.trim() || "PREPAID";
    map.set(mode, (map.get(mode) || 0) + 1);
    total++;
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-5)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Orders Grouped by Channel of Sale (Flipkart Marketplace vs Shopsy)
 */
export function getOrdersByChannel(orders: OrderPnlRecord[]): SimpleBarDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  orders.forEach((o) => {
    const ch = o.channelOfSale?.trim() || "Flipkart";
    map.set(ch, (map.get(ch) || 0) + 1);
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} items`,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Top SKUs by Billed Order Item Value
 */
export function getTopOrderValueBySku(orders: OrderPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!orders || orders.length === 0) return [];

  const map = new Map<string, number>();
  orders.forEach((o) => {
    const sku = o.sku?.trim() || "Unknown SKU";
    map.set(sku, (map.get(sku) || 0) + (o.orderItemValue || 0));
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value]) => ({
      label,
      value,
      formattedValue: formatINR(value),
      rawKey: label,
      fill: "var(--chart-1)",
    }));
}
