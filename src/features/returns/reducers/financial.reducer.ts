import { ReturnRecord } from "../types/return.types";
import { FinancialAnalytics } from "../types/analytics.types";
import { formatReturnType } from "../constants/return.constants";

/**
 * Calculates Financial return value analytics
 *
 * Source Column: Total Price
 * Terminology rule: Use Return Value / Returned Order Value ONLY.
 */
export function calculateFinancialAnalytics(returns: ReturnRecord[]): FinancialAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      totalReturnValue: 0,
      averageReturnValue: 0,
      highestReturnValue: 0,
      lowestReturnValue: 0,
      valueBySku: [],
      valueByReason: [],
      valueByReturnType: [],
    };
  }

  let totalReturnValue = 0;
  let highestReturnValue = 0;
  let lowestReturnValue = Infinity;

  const skuValueMap: Record<string, number> = {};
  const reasonValueMap: Record<string, number> = {};
  const typeValueMap: Record<string, number> = {};

  returns.forEach((r) => {
    const val = r.totalPrice;
    totalReturnValue += val;

    if (val > highestReturnValue) highestReturnValue = val;
    if (val < lowestReturnValue) lowestReturnValue = val;

    if (r.sku) {
      skuValueMap[r.sku] = (skuValueMap[r.sku] || 0) + val;
    }
    if (r.returnReason) {
      reasonValueMap[r.returnReason] = (reasonValueMap[r.returnReason] || 0) + val;
    }
    if (r.returnType) {
      typeValueMap[r.returnType] = (typeValueMap[r.returnType] || 0) + val;
    }
  });

  const valueBySku = Object.entries(skuValueMap)
    .map(([sku, value]) => ({ sku, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const valueByReason = Object.entries(reasonValueMap)
    .map(([reason, value]) => ({ reason, value }))
    .sort((a, b) => b.value - a.value);

  const valueByReturnType = Object.entries(typeValueMap)
    .map(([type, value]) => ({
      type,
      label: formatReturnType(type),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalReturnValue,
    averageReturnValue: total > 0 ? totalReturnValue / total : 0,
    highestReturnValue,
    lowestReturnValue: lowestReturnValue === Infinity ? 0 : lowestReturnValue,
    valueBySku,
    valueByReason,
    valueByReturnType,
  };
}
