import { ReturnRecord } from "../types/return.types";
import { ProductAnalytics, SkuProductMetric } from "../types/analytics.types";

/**
 * Calculates Product & SKU return analytics
 *
 * Source Columns: SKU, FSN, Product, Quantity, Total Price, Return Reason
 */
export function calculateProductAnalytics(returns: ReturnRecord[]): ProductAnalytics {
  if (returns.length === 0) {
    return {
      totalUniqueSkus: 0,
      skus: [],
      topByCount: [],
      topByValue: [],
      topByQuantity: [],
    };
  }

  const skuMap: Record<
    string,
    {
      fsn: string;
      product: string;
      returnCount: number;
      quantityReturned: number;
      returnValue: number;
      reasons: Record<string, number>;
    }
  > = {};

  returns.forEach((r) => {
    const skuKey = r.sku.trim() || "UNKNOWN_SKU";

    if (!skuMap[skuKey]) {
      skuMap[skuKey] = {
        fsn: r.fsn,
        product: r.product,
        returnCount: 0,
        quantityReturned: 0,
        returnValue: 0,
        reasons: {},
      };
    }

    const item = skuMap[skuKey];
    item.returnCount += 1;
    item.quantityReturned += r.quantity;
    item.returnValue += r.totalPrice;

    // Maintain fallback product / FSN if earlier row had blanks
    if (!item.product && r.product) item.product = r.product;
    if (!item.fsn && r.fsn) item.fsn = r.fsn;

    if (r.returnReason) {
      item.reasons[r.returnReason] = (item.reasons[r.returnReason] || 0) + 1;
    }
  });

  const skus: SkuProductMetric[] = Object.entries(skuMap).map(([sku, data]) => {
    // Find top reason for this SKU
    let topReason: string | null = null;
    let topReasonCount = 0;
    Object.entries(data.reasons).forEach(([reason, count]) => {
      if (count > topReasonCount) {
        topReasonCount = count;
        topReason = reason;
      }
    });

    return {
      sku,
      fsn: data.fsn,
      product: data.product,
      returnCount: data.returnCount,
      quantityReturned: data.quantityReturned,
      returnValue: data.returnValue,
      topReason,
    };
  });

  const topByCount = [...skus].sort((a, b) => b.returnCount - a.returnCount).slice(0, 10);
  const topByValue = [...skus].sort((a, b) => b.returnValue - a.returnValue).slice(0, 10);
  const topByQuantity = [...skus].sort((a, b) => b.quantityReturned - a.quantityReturned).slice(0, 10);

  return {
    totalUniqueSkus: skus.length,
    skus,
    topByCount,
    topByValue,
    topByQuantity,
  };
}
