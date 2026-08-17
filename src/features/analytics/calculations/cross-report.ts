import { PnlReport } from "@/features/reports/models/pnl.models";
import { ReturnRecord } from "@/features/reports/models/returns.models";
import { ScatterPointDatum } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Scatter Plot 1: Accounted Net Sales (X) vs Return Rate % (Y)
 */
export function getSalesVsReturnRateScatter(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null
): ScatterPointDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  // Count Returns report items by SKU if available
  const returnsCountMap = new Map<string, number>();
  if (returns) {
    returns.forEach((r) => {
      const sku = (r.sku || "").trim().toLowerCase();
      if (sku) {
        returnsCountMap.set(sku, (returnsCountMap.get(sku) || 0) + (Number(r.quantity) || 1));
      }
    });
  }

  return pnl.skuLevel
    .filter((s) => (s.grossUnits || 0) > 0)
    .map((s, idx) => {
      const gross = s.grossUnits || 1;
      const pnlReturns = s.returnedCancelledUnits || (s.rtoUnits || 0) + (s.rvpUnits || 0) + (s.cancelledUnits || 0);
      const crossReturns = returnsCountMap.get((s.sku || "").trim().toLowerCase());
      const totalRet = crossReturns !== undefined ? crossReturns : pnlReturns;
      const rate = Number(((totalRet / gross) * 100).toFixed(1));
      const sales = s.accountedNetSales || s.estimatedNetSales || 0;

      return {
        id: `scatter_sales_${idx}`,
        name: s.sku || `SKU_${idx + 1}`,
        sku: s.sku,
        x: sales,
        y: rate,
        z: gross,
        formattedX: formatINR(sales),
        formattedY: `${rate}% (${totalRet}/${gross} units)`,
      };
    });
}

/**
 * Scatter Plot 2: Net Earnings (X) vs Return Rate % (Y)
 */
export function getEarningsVsReturnRateScatter(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null
): ScatterPointDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return pnl.skuLevel
    .filter((s) => (s.grossUnits || 0) > 0)
    .map((s, idx) => {
      const gross = s.grossUnits || 1;
      const ret = s.returnedCancelledUnits || (s.rtoUnits || 0) + (s.rvpUnits || 0) + (s.cancelledUnits || 0);
      const rate = Number(((ret / gross) * 100).toFixed(1));
      const earnings = s.netEarnings || 0;

      return {
        id: `scatter_earn_${idx}`,
        name: s.sku || `SKU_${idx + 1}`,
        sku: s.sku,
        x: earnings,
        y: rate,
        z: gross,
        formattedX: formatINR(earnings),
        formattedY: `${rate}% return rate`,
      };
    });
}

/**
 * Scatter Plot 3: Accounted Net Sales (X) vs Customer Returns RVP Units (Y)
 */
export function getSalesVsCustomerReturnsScatter(
  pnl?: PnlReport | null,
  returns?: ReturnRecord[] | null
): ScatterPointDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return pnl.skuLevel.map((s, idx) => {
    const sales = s.accountedNetSales || s.estimatedNetSales || 0;
    const rvp = s.rvpUnits || 0;

    return {
      id: `scatter_rvp_${idx}`,
      name: s.sku || `SKU_${idx + 1}`,
      sku: s.sku,
      x: sales,
      y: rvp,
      z: s.grossUnits || 1,
      formattedX: formatINR(sales),
      formattedY: `${rvp} RVP customer returns`,
    };
  });
}

/**
 * Scatter Plot 4: Cancellations Units (X) vs Net Earnings (Y)
 */
export function getCancellationVsEarningsScatter(pnl?: PnlReport | null): ScatterPointDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return pnl.skuLevel.map((s, idx) => {
    const cancels = s.cancelledUnits || 0;
    const earnings = s.netEarnings || 0;

    return {
      id: `scatter_cancel_${idx}`,
      name: s.sku || `SKU_${idx + 1}`,
      sku: s.sku,
      x: cancels,
      y: earnings,
      z: s.grossUnits || 1,
      formattedX: `${cancels} cancellations`,
      formattedY: formatINR(earnings),
    };
  });
}
