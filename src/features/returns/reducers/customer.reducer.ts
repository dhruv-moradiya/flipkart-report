import { ReturnRecord } from "../types/return.types";
import { CustomerAnalytics } from "../types/analytics.types";

/**
 * Calculates Customer & B2B GSTIN analytics
 *
 * Source Columns: Customer GSTIN, Customer Company Name, Order Type
 */
export function calculateCustomerAnalytics(returns: ReturnRecord[]): CustomerAnalytics {
  let recordsWithGstin = 0;
  let recordsWithCompanyName = 0;
  const orderTypeMap: Record<string, number> = {};

  returns.forEach((r) => {
    if (r.customerGstin) recordsWithGstin++;
    if (r.customerCompanyName) recordsWithCompanyName++;
    if (r.orderType) {
      orderTypeMap[r.orderType] = (orderTypeMap[r.orderType] || 0) + 1;
    }
  });

  const orderTypes = Object.entries(orderTypeMap)
    .map(([orderType, count]) => ({ orderType, count }))
    .sort((a, b) => b.count - a.count);

  const hasData = recordsWithGstin > 0 || recordsWithCompanyName > 0 || orderTypes.length > 0;

  return {
    hasData,
    recordsWithGstin,
    recordsWithCompanyName,
    orderTypes,
  };
}
