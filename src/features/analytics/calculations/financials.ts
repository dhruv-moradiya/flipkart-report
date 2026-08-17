import { PnlReport } from "@/features/reports/models/pnl.models";
import {
  SimpleBarDatum,
  PieChartDatum,
  TopNCount,
} from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

/**
 * Financial Progression Waterfall / Funnel:
 * Estimated Sales -> Accounted Sales -> Total Expenses -> Benefits -> Projected Settlement -> ITC -> Net Earnings
 */
export function getFinancialFunnelProgression(
  pnl?: PnlReport | null,
): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let estSales = 0;
  let accSales = 0;
  let expenses = 0;
  let benefits = 0;
  let bankSettlement = 0;
  let itc = 0;
  let netEarnings = 0;

  pnl.skuLevel.forEach((s) => {
    estSales += s.estimatedNetSales || 0;
    accSales += s.accountedNetSales || 0;
    expenses += s.totalExpenses || 0;
    benefits += s.totalBenefits || 0;
    bankSettlement += s.bankSettlement || 0;
    itc += s.inputTaxCredits || 0;
    netEarnings += s.netEarnings || 0;
  });

  return [
    {
      label: "1. Estimated Sales",
      value: estSales,
      formattedValue: formatINR(estSales),
      fill: "var(--chart-1)",
    },
    {
      label: "2. Accounted Sales",
      value: accSales,
      formattedValue: formatINR(accSales),
      fill: "var(--chart-2)",
    },
    {
      label: "3. Total Expenses",
      value: Math.abs(expenses),
      secondaryValue: expenses,
      formattedValue: formatINR(expenses),
      fill: "var(--chart-5)",
    },
    {
      label: "4. Benefits & SPF",
      value: benefits,
      formattedValue: formatINR(benefits),
      fill: "var(--chart-3)",
    },
    {
      label: "5. Projected Settlement",
      value: bankSettlement,
      formattedValue: formatINR(bankSettlement),
      fill: "var(--chart-4)",
    },
    {
      label: "6. Input Tax Credits",
      value: itc,
      formattedValue: formatINR(itc),
      fill: "var(--chart-2)",
    },
    {
      label: "7. Net Earnings",
      value: netEarnings,
      formattedValue: formatINR(netEarnings),
      fill: "var(--chart-1)",
    },
  ];
}

/**
 * Top SKUs by Net Earnings Contribution
 */
export function getSkuEarningsDistribution(
  pnl?: PnlReport | null,
  topN: TopNCount = 10,
): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return [...pnl.skuLevel]
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
 * Settlement Balance: Amount Settled vs Amount Pending
 */
export function getSettlementBalance(pnl?: PnlReport | null): PieChartDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let settled = 0;
  let pending = 0;

  pnl.skuLevel.forEach((s) => {
    settled += s.amountSettled || 0;
    pending += s.amountPending || 0;
  });

  const total = settled + pending;

  return [
    {
      name: "Amount Settled",
      value: settled,
      percentage: total > 0 ? (settled / total) * 100 : 0,
      fill: "var(--chart-1)",
    },
    {
      name: "Amount Pending",
      value: pending,
      percentage: total > 0 ? (pending / total) * 100 : 0,
      fill: "var(--chart-5)",
    },
  ];
}

/**
 * Input Tax Credits Breakdown (ITC GST/TCS vs ITC TDS)
 */
export function getInputTaxCreditsBreakdown(
  pnl?: PnlReport | null,
): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let itcGstTcs = 0;
  let itcTds = 0;

  pnl.skuLevel.forEach((s) => {
    itcGstTcs += s.itcGstTcs || 0;
    itcTds += s.itcTds || 0;
  });

  return [
    {
      label: "ITC (GST & TCS)",
      value: itcGstTcs,
      formattedValue: formatINR(itcGstTcs),
      fill: "var(--chart-1)",
    },
    {
      label: "ITC (TDS)",
      value: itcTds,
      formattedValue: formatINR(itcTds),
      fill: "var(--chart-2)",
    },
  ];
}
