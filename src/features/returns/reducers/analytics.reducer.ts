import { ReturnRecord } from "../types/return.types";
import { ReturnAnalytics } from "../types/analytics.types";
import { calculateOverview } from "./overview.reducer";
import { calculateIdentity } from "./identity.reducer";
import { calculateProductAnalytics } from "./product.reducer";
import { calculateFinancialAnalytics } from "./financial.reducer";
import { calculateStatusAnalytics } from "./status.reducer";
import { calculateCompletionAnalytics } from "./completion.reducer";
import { calculateReturnTypeAnalytics } from "./return-type.reducer";
import { calculateReasonAnalytics } from "./reason.reducer";
import { calculateSubReasonAnalytics } from "./sub-reason.reducer";
import { calculateTimelineAnalytics } from "./timeline.reducer";
import { calculateLogisticsAnalytics } from "./logistics.reducer";
import { calculateLocationAnalytics } from "./location.reducer";
import { calculateCustomerAnalytics } from "./customer.reducer";
import { calculateInvoiceAnalytics } from "./invoice.reducer";
import { calculateOperationalAnalytics } from "./operational.reducer";
import { calculateCommentsAnalytics } from "./comments.reducer";
import { calculateAgingAnalytics } from "./aging.reducer";

/**
 * Master Domain Analytics Reducer
 * Pure, reusable composition function independent of React
 */
export function buildReturnAnalytics(returns: ReturnRecord[]): ReturnAnalytics {
  return {
    overview: calculateOverview(returns),
    identity: calculateIdentity(returns),
    product: calculateProductAnalytics(returns),
    financial: calculateFinancialAnalytics(returns),
    status: calculateStatusAnalytics(returns),
    completion: calculateCompletionAnalytics(returns),
    returnType: calculateReturnTypeAnalytics(returns),
    reason: calculateReasonAnalytics(returns),
    subReason: calculateSubReasonAnalytics(returns),
    timeline: calculateTimelineAnalytics(returns),
    logistics: calculateLogisticsAnalytics(returns),
    location: calculateLocationAnalytics(returns),
    customer: calculateCustomerAnalytics(returns),
    invoice: calculateInvoiceAnalytics(returns),
    operational: calculateOperationalAnalytics(returns),
    comments: calculateCommentsAnalytics(returns),
    aging: calculateAgingAnalytics(returns),
  };
}
