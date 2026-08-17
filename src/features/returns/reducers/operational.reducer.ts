import { ReturnRecord } from "../types/return.types";
import { OperationalAnalytics } from "../types/analytics.types";

/**
 * Calculates Operational & Proof-of-Delivery analytics
 *
 * Source Columns:
 * - Flyer Status, Flyer Captured, Flyer Actual
 * - OBD Eligible, OBD Status, OBD Remarks
 * - Delivery Proof Time, Delivery Proof OTC
 */
export function calculateOperationalAnalytics(returns: ReturnRecord[]): OperationalAnalytics {
  let recordsWithFlyer = 0;
  let recordsWithObd = 0;
  let recordsWithProof = 0;

  returns.forEach((r) => {
    if (r.flyerStatus || r.flyerCaptured || r.flyerActual) recordsWithFlyer++;
    if (r.obdEligible || r.obdStatus || r.obdRemarks) recordsWithObd++;
    if (r.deliveryProofTime || r.deliveryProofOtc) recordsWithProof++;
  });

  const hasData = recordsWithFlyer > 0 || recordsWithObd > 0 || recordsWithProof > 0;

  return {
    hasData,
    recordsWithFlyer,
    recordsWithObd,
    recordsWithProof,
  };
}
