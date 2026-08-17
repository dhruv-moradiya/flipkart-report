import { PnlReport, SkuPnlRecord } from "@/features/reports/models/pnl.models";
import { SimpleBarDatum, GroupedBarDatum, TopNCount } from "../types/analytics.types";
import { formatINR } from "@/features/reports/excel/value-parser";

export const FEE_SELECT_OPTIONS = [
  { id: "commissionFee", label: "Commission Fee" },
  { id: "fixedFee", label: "Fixed Fee" },
  { id: "collectionFee", label: "Collection Fee" },
  { id: "pickAndPackFee", label: "Pick and Pack Fee" },
  { id: "forwardShippingFee", label: "Forward Shipping Fee" },
  { id: "reverseShippingFee", label: "Reverse Shipping Fee" },
  { id: "storageFee", label: "Storage Fee" },
  { id: "recallFee", label: "Recall Fee" },
  { id: "taxesGst", label: "Taxes (GST)" },
  { id: "taxesTcs", label: "Taxes (TCS)" },
  { id: "taxesTds", label: "Taxes (TDS)" },
  { id: "offerAdjustments", label: "Offer Adjustments" },
  { id: "productCancellationFee", label: "Product Cancellation Penalty" },
];

/**
 * Aggregates all 20 Fee & Tax Categories across the entire P&L report
 */
export function getAllFeeCategoriesAggregated(pnl?: PnlReport | null): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  const totals: Record<string, { label: string; signed: number }> = {
    commissionFee: { label: "Commission Fee", signed: 0 },
    fixedFee: { label: "Fixed Fee", signed: 0 },
    collectionFee: { label: "Collection Fee", signed: 0 },
    pickAndPackFee: { label: "Pick & Pack Fee", signed: 0 },
    forwardShippingFee: { label: "Forward Shipping", signed: 0 },
    reverseShippingFee: { label: "Reverse Shipping", signed: 0 },
    storageFee: { label: "Storage Fee", signed: 0 },
    recallFee: { label: "Recall Fee", signed: 0 },
    taxesGst: { label: "Taxes (GST)", signed: 0 },
    taxesTcs: { label: "Taxes (TCS)", signed: 0 },
    taxesTds: { label: "Taxes (TDS)", signed: 0 },
    offerAdjustments: { label: "Offer Adjustments", signed: 0 },
    noCostEmiFeeReimbursement: { label: "No Cost EMI Subvention", signed: 0 },
    installationFee: { label: "Installation Fee", signed: 0 },
    techVisitFee: { label: "Tech Visit Fee", signed: 0 },
    uninstallationPackagingFee: { label: "Uninstallation & Packaging", signed: 0 },
    customerAddOnsAmountRecovery: { label: "Customer Add-ons Recovery", signed: 0 },
    franchiseFee: { label: "Franchise Fee", signed: 0 },
    shopsyMarketingFee: { label: "Shopsy Marketing Fee", signed: 0 },
    productCancellationFee: { label: "Cancellation Penalty", signed: 0 },
  };

  pnl.skuLevel.forEach((s) => {
    Object.keys(totals).forEach((key) => {
      const val = (s as unknown as Record<string, unknown>)[key];
      if (typeof val === "number") {
        totals[key].signed += val;
      }
    });
  });

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return Object.entries(totals)
    .filter(([_, data]) => data.signed !== 0)
    .sort((a, b) => Math.abs(b[1].signed) - Math.abs(a[1].signed))
    .map(([key, data], idx) => ({
      label: data.label,
      value: Math.abs(data.signed),
      secondaryValue: data.signed,
      formattedValue: formatINR(data.signed),
      rawKey: key,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Top SKUs for a specific selected fee category (e.g. Commission, Shipping, GST)
 */
export function getSkuFeeBreakdown(
  pnl?: PnlReport | null,
  feeKey = "commissionFee",
  topN: TopNCount = 10
): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return [...pnl.skuLevel]
    .map((s) => {
      const signedVal = Number((s as unknown as Record<string, unknown>)[feeKey]) || 0;
      return {
        label: s.sku || "Unknown SKU",
        value: Math.abs(signedVal),
        secondaryValue: signedVal,
        formattedValue: formatINR(signedVal),
        rawKey: s.sku,
        fill: "var(--chart-5)",
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

/**
 * Forward Shipping vs Reverse Shipping Cost comparison by SKU
 */
export function getShippingCostComparison(pnl?: PnlReport | null, topN: TopNCount = 10): GroupedBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  return [...pnl.skuLevel]
    .sort((a, b) => Math.abs(b.forwardShippingFee || 0) + Math.abs(b.reverseShippingFee || 0) - (Math.abs(a.forwardShippingFee || 0) + Math.abs(a.reverseShippingFee || 0)))
    .slice(0, topN)
    .map((s, idx) => ({
      category: s.sku || `SKU_${idx + 1}`,
      "Forward Shipping (Magnitude)": Math.abs(s.forwardShippingFee || 0),
      "Reverse Shipping (Magnitude)": Math.abs(s.reverseShippingFee || 0),
    }));
}

/**
 * Marketplace Core Fees: Commission vs Fixed Fee vs Collection Fee
 */
export function getMarketplaceFeesBreakdown(pnl?: PnlReport | null): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let comm = 0;
  let fixed = 0;
  let coll = 0;

  pnl.skuLevel.forEach((s) => {
    comm += s.commissionFee || 0;
    fixed += s.fixedFee || 0;
    coll += s.collectionFee || 0;
  });

  return [
    {
      label: "Commission Fee",
      value: Math.abs(comm),
      secondaryValue: comm,
      formattedValue: formatINR(comm),
      fill: "var(--chart-1)",
    },
    {
      label: "Fixed Fee",
      value: Math.abs(fixed),
      secondaryValue: fixed,
      formattedValue: formatINR(fixed),
      fill: "var(--chart-2)",
    },
    {
      label: "Collection Fee",
      value: Math.abs(coll),
      secondaryValue: coll,
      formattedValue: formatINR(coll),
      fill: "var(--chart-3)",
    },
  ];
}

/**
 * Tax Breakdown: GST vs TCS vs TDS
 */
export function getTaxBreakdown(pnl?: PnlReport | null): SimpleBarDatum[] {
  if (!pnl || !pnl.skuLevel) return [];

  let gst = 0;
  let tcs = 0;
  let tds = 0;

  pnl.skuLevel.forEach((s) => {
    gst += s.taxesGst || 0;
    tcs += s.taxesTcs || 0;
    tds += s.taxesTds || 0;
  });

  return [
    {
      label: "Taxes (GST)",
      value: Math.abs(gst),
      secondaryValue: gst,
      formattedValue: formatINR(gst),
      fill: "var(--chart-1)",
    },
    {
      label: "Taxes (TCS)",
      value: Math.abs(tcs),
      secondaryValue: tcs,
      formattedValue: formatINR(tcs),
      fill: "var(--chart-2)",
    },
    {
      label: "Taxes (TDS)",
      value: Math.abs(tds),
      secondaryValue: tds,
      formattedValue: formatINR(tds),
      fill: "var(--chart-4)",
    },
  ];
}
