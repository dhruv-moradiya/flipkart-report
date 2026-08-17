import { ReturnRecord } from "../types/return.types";
import { LogisticsAnalytics, VendorMetric } from "../types/analytics.types";

/**
 * Calculates Logistics & Courier fulfillment analytics
 *
 * Source Columns:
 * - FF Type
 * - Shipment Type
 * - Vendor Name
 * - Tracking ID
 * - Out For Delivery Date
 * - Picked Up Date
 */
export function calculateLogisticsAnalytics(returns: ReturnRecord[]): LogisticsAnalytics {
  const total = returns.length;

  if (total === 0) {
    return {
      fulfillmentType: "N/A",
      isSingleFfType: true,
      shipmentType: "N/A",
      isSingleShipmentType: true,
      vendors: [],
      hasTrackingCount: 0,
      isPickedUpCount: 0,
      isOutForDeliveryCount: 0,
    };
  }

  const ffTypeSet = new Set<string>();
  const shipmentTypeSet = new Set<string>();
  const vendorMap: Record<
    string,
    { count: number; totalValue: number; customerReturns: number; courierReturns: number }
  > = {};

  let hasTrackingCount = 0;
  let isPickedUpCount = 0;
  let isOutForDeliveryCount = 0;

  returns.forEach((r) => {
    if (r.ffType) ffTypeSet.add(r.ffType);
    if (r.shipmentType) shipmentTypeSet.add(r.shipmentType);

    if (r.trackingId) hasTrackingCount++;
    if (r.pickedUpDate) isPickedUpCount++;
    if (r.outForDeliveryDate) isOutForDeliveryCount++;

    const vendor = r.vendorName.trim() || "Unassigned Logistics";
    if (!vendorMap[vendor]) {
      vendorMap[vendor] = { count: 0, totalValue: 0, customerReturns: 0, courierReturns: 0 };
    }
    vendorMap[vendor].count++;
    vendorMap[vendor].totalValue += r.totalPrice;

    if (r.returnType.toLowerCase().trim() === "customer_return") {
      vendorMap[vendor].customerReturns++;
    } else if (r.returnType.toLowerCase().trim() === "courier_return") {
      vendorMap[vendor].courierReturns++;
    }
  });

  const vendors: VendorMetric[] = Object.entries(vendorMap)
    .map(([vendorName, data]) => ({
      vendorName,
      count: data.count,
      percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
      totalValue: data.totalValue,
      customerReturns: data.customerReturns,
      courierReturns: data.courierReturns,
    }))
    .sort((a, b) => b.count - a.count);

  const ffTypes = Array.from(ffTypeSet);
  const shipmentTypes = Array.from(shipmentTypeSet);

  return {
    fulfillmentType: ffTypes.join(", ") || "NON_FBF",
    isSingleFfType: ffTypes.length <= 1,
    shipmentType: shipmentTypes.join(", ") || "NORMAL",
    isSingleShipmentType: shipmentTypes.length <= 1,
    vendors,
    hasTrackingCount,
    isPickedUpCount,
    isOutForDeliveryCount,
  };
}
