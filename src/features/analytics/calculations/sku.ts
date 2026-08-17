import { SkuPnlRecord } from "@/features/reports/models/pnl.models";
import { SimpleBarDatum, GroupedBarDatum, TopNCount } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Top SKUs by Net Earnings
 */
export function getTopSkusByEarnings(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .sort((a, b) => (b.netEarnings || 0) - (a.netEarnings || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `SKU_${idx + 1}`,
      value: s.netEarnings || 0,
      formattedValue: formatINR(s.netEarnings || 0),
      rawKey: s.sku,
      fill: "var(--chart-1)",
    }));
}

/**
 * Top SKUs by Estimated / Accounted Net Sales
 */
export function getTopSkusBySales(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .sort((a, b) => (b.accountedNetSales || b.estimatedNetSales || 0) - (a.accountedNetSales || a.estimatedNetSales || 0))
    .slice(0, topN)
    .map((s, idx) => {
      const sales = s.accountedNetSales || s.estimatedNetSales || 0;
      return {
        label: s.sku || `SKU_${idx + 1}`,
        value: sales,
        formattedValue: formatINR(sales),
        rawKey: s.sku,
        fill: "var(--chart-2)",
      };
    });
}

/**
 * Top SKUs by Total Expense Magnitude (Preserving original signed value in metadata)
 */
export function getTopSkusByExpenseMagnitude(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .sort((a, b) => Math.abs(b.totalExpenses || 0) - Math.abs(a.totalExpenses || 0))
    .slice(0, topN)
    .map((s, idx) => {
      const mag = Math.abs(s.totalExpenses || 0);
      return {
        label: s.sku || `SKU_${idx + 1}`,
        value: mag,
        secondaryValue: s.totalExpenses || 0, // Original signed
        formattedValue: formatINR(s.totalExpenses || 0),
        rawKey: s.sku,
        fill: "var(--chart-5)",
      };
    });
}

/**
 * Top SKUs by Return + Cancellation Rate (%)
 */
export function getTopSkusByReturnRate(skus: SkuPnlRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .filter((s) => (s.grossUnits || 0) > 0)
    .map((s, idx) => {
      const gross = s.grossUnits || 0;
      const retCanc = s.returnedCancelledUnits || (s.rtoUnits || 0) + (s.rvpUnits || 0) + (s.cancelledUnits || 0);
      const rate = gross > 0 ? (retCanc / gross) * 100 : 0;
      return {
        label: s.sku || `SKU_${idx + 1}`,
        value: Number(rate.toFixed(1)),
        secondaryValue: gross,
        formattedValue: `${rate.toFixed(1)}% (${retCanc}/${gross} units)`,
        rawKey: s.sku,
        fill: "var(--chart-3)",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

/**
 * SKU Breakdown: RTO (Logistics Return) vs RVP (Customer Return) vs Cancellations
 */
export function getSkuRvpVsRtoVsCancel(skus: SkuPnlRecord[], topN: TopNCount = 10): GroupedBarDatum[] {
  if (!skus || skus.length === 0) return [];

  return [...skus]
    .sort(
      (a, b) =>
        (b.rtoUnits || 0) + (b.rvpUnits || 0) + (b.cancelledUnits || 0) -
        ((a.rtoUnits || 0) + (a.rvpUnits || 0) + (a.cancelledUnits || 0))
    )
    .slice(0, topN)
    .map((s, idx) => ({
      category: s.sku || `SKU_${idx + 1}`,
      "Logistics Return (RTO)": s.rtoUnits || 0,
      "Customer Return (RVP)": s.rvpUnits || 0,
      Cancellations: s.cancelledUnits || 0,
    }));
}

/**
 * Top Profitable and Lowest Earning SKUs by Earnings Per Unit (EPU)
 */
export function getSkuEarningsPerUnit(skus: SkuPnlRecord[], topN: TopNCount = 10): {
  topProfitable: SimpleBarDatum[];
  lowestProfitable: SimpleBarDatum[];
} {
  if (!skus || skus.length === 0) {
    return { topProfitable: [], lowestProfitable: [] };
  }

  const valid = [...skus].filter((s) => (s.netUnits || 0) > 0);

  const topProfitable = [...valid]
    .sort((a, b) => (b.earningsPerUnit || 0) - (a.earningsPerUnit || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `SKU_${idx + 1}`,
      value: s.earningsPerUnit || 0,
      formattedValue: formatINR(s.earningsPerUnit || 0),
      rawKey: s.sku,
      fill: "var(--chart-1)",
    }));

  const lowestProfitable = [...valid]
    .sort((a, b) => (a.earningsPerUnit || 0) - (b.earningsPerUnit || 0))
    .slice(0, topN)
    .map((s, idx) => ({
      label: s.sku || `SKU_${idx + 1}`,
      value: s.earningsPerUnit || 0,
      formattedValue: formatINR(s.earningsPerUnit || 0),
      rawKey: s.sku,
      fill: "var(--chart-4)",
    }));

  return { topProfitable, lowestProfitable };
}
