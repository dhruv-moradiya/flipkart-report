import { ReturnRecord } from "../types/return.types";
import { IdentityAnalytics } from "../types/analytics.types";

/**
 * Calculates Unique Identifiers across the return dataset
 */
export function calculateIdentity(returns: ReturnRecord[]): IdentityAnalytics {
  const orderSet = new Set<string>();
  const returnSet = new Set<string>();
  const shipmentSet = new Set<string>();
  const trackingSet = new Set<string>();
  const skuSet = new Set<string>();
  const fsnSet = new Set<string>();

  returns.forEach((r) => {
    if (r.orderId) orderSet.add(r.orderId);
    if (r.returnId) returnSet.add(r.returnId);
    if (r.shipmentId) shipmentSet.add(r.shipmentId);
    if (r.trackingId) trackingSet.add(r.trackingId);
    if (r.sku) skuSet.add(r.sku);
    if (r.fsn) fsnSet.add(r.fsn);
  });

  return {
    uniqueOrders: orderSet.size,
    uniqueReturns: returnSet.size,
    uniqueShipments: shipmentSet.size,
    uniqueTrackingIds: trackingSet.size,
    uniqueSkus: skuSet.size,
    uniqueFsns: fsnSet.size,
  };
}
