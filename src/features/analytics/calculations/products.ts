import { PnlReport, SkuPnlRecord } from "@/features/reports/models/pnl.models";
import { ReturnRecord } from "@/features/reports/models/returns.models";
import { SimpleBarDatum, TopNCount } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Top Products by Accounted Net Sales
 */
export function getTopProductsBySales(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null,
  topN: TopNCount = 10
): SimpleBarDatum[] {
  if (pnl && pnl.skuLevel.length > 0) {
    return [...pnl.skuLevel]
      .sort((a, b) => (b.accountedNetSales || 0) - (a.accountedNetSales || 0))
      .slice(0, topN)
      .map((s, idx) => ({
        label: s.sku || `Product_${idx + 1}`,
        value: s.accountedNetSales || 0,
        formattedValue: formatINR(s.accountedNetSales || 0),
        rawKey: s.sku,
        fill: "var(--chart-1)",
      }));
  }

  if (returns && returns.length > 0) {
    const map = new Map<string, number>();
    returns.forEach((r) => {
      const name = r.product || r.sku || "Unknown Product";
      map.set(name, (map.get(name) || 0) + (r.totalPrice || 0));
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([label, value]) => ({
        label,
        value,
        formattedValue: formatINR(value),
        fill: "var(--chart-1)",
      }));
  }

  return [];
}

/**
 * Top Products by Net Earnings (From P&L)
 */
export function getTopProductsByEarnings(pnl?: PnlReport | null, topN: TopNCount = 10): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return [...pnl.skuLevel]
    .sort((a, b) => (b.netEarnings || 0) - (a.netEarnings || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `Product_${idx + 1}`,
      value: s.netEarnings || 0,
      formattedValue: formatINR(s.netEarnings || 0),
      rawKey: s.sku,
      fill: "var(--chart-2)",
    }));
}

/**
 * Top Products by Gross Ordered Units
 */
export function getTopProductsByUnits(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null,
  topN: TopNCount = 10
): SimpleBarDatum[] {
  if (pnl && pnl.skuLevel.length > 0) {
    return [...pnl.skuLevel]
      .sort((a, b) => (b.grossUnits || 0) - (a.grossUnits || 0))
      .slice(0, topN)
      .map((s, idx) => ({
        label: s.sku || `Product_${idx + 1}`,
        value: s.grossUnits || 0,
        formattedValue: `${s.grossUnits.toLocaleString()} units`,
        rawKey: s.sku,
        fill: "var(--chart-3)",
      }));
  }

  if (returns && returns.length > 0) {
    const map = new Map<string, number>();
    returns.forEach((r) => {
      const name = r.product || r.sku || "Unknown Product";
      map.set(name, (map.get(name) || 0) + (Number(r.quantity) || 1));
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([label, value]) => ({
        label,
        value,
        formattedValue: `${value.toLocaleString()} units`,
        fill: "var(--chart-3)",
      }));
  }

  return [];
}

/**
 * Top Products / SKUs by Customer Returns (RVP)
 */
export function getTopProductsByCustomerReturns(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .filter((s) => (s.rvpUnits || 0) > 0)
    .sort((a, b) => (b.rvpUnits || 0) - (a.rvpUnits || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `Product_${idx + 1}`,
      value: s.rvpUnits || 0,
      formattedValue: `${s.rvpUnits} customer returns`,
      rawKey: s.sku,
      fill: "var(--chart-5)",
    }));
}

/**
 * Top Products / SKUs by Cancellations
 */
export function getTopProductsByCancellations(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .filter((s) => (s.cancelledUnits || 0) > 0)
    .sort((a, b) => (b.cancelledUnits || 0) - (a.cancelledUnits || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `Product_${idx + 1}`,
      value: s.cancelledUnits || 0,
      formattedValue: `${s.cancelledUnits} cancellations`,
      rawKey: s.sku,
      fill: "var(--chart-4)",
    }));
}

/**
 * Top Products / SKUs by Logistics Returns (RTO)
 */
export function getTopProductsByRto(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .filter((s) => (s.rtoUnits || 0) > 0)
    .sort((a, b) => (b.rtoUnits || 0) - (a.rtoUnits || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `Product_${idx + 1}`,
      value: s.rtoUnits || 0,
      formattedValue: `${s.rtoUnits} RTO returns`,
      rawKey: s.sku,
      fill: "var(--chart-2)",
    }));
}
