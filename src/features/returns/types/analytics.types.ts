export interface OverviewAnalytics {
  totalReturns: number;
  uniqueOrders: number;
  uniqueSkus: number;
  totalQuantity: number;
  totalReturnValue: number;
  averageReturnValue: number;
}

export interface ReturnTypeMetric {
  type: string;
  label: string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface ReturnTypeAnalytics {
  customerReturns: number;
  courierReturns: number;
  total: number;
  items: ReturnTypeMetric[];
}

export interface ReturnStatusMetric {
  status: string;
  label: string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface ReturnStatusAnalytics {
  inTransit: number;
  start: number;
  total: number;
  items: ReturnStatusMetric[];
}

export interface CompletionStatusMetric {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface CompletionStatusAnalytics {
  openReturns: number;
  completedReturns: number;
  total: number;
  items: CompletionStatusMetric[];
}

export interface ReasonMetric {
  reason: string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface ReasonAnalytics {
  topReasons: ReasonMetric[];
  allReasons: ReasonMetric[];
  totalReasonsCount: number;
}

export interface SubReasonMetric {
  subReason: string;
  count: number;
  percentage: number;
}

export interface ReasonWithSubReasons {
  reason: string;
  count: number;
  subReasons: SubReasonMetric[];
}

export interface SubReasonAnalytics {
  byParentReason: ReasonWithSubReasons[];
}

export interface SkuProductMetric {
  sku: string;
  fsn: string;
  product: string;
  returnCount: number;
  quantityReturned: number;
  returnValue: number;
  topReason: string | null;
}

export interface ProductAnalytics {
  totalUniqueSkus: number;
  skus: SkuProductMetric[];
  topByCount: SkuProductMetric[];
  topByValue: SkuProductMetric[];
  topByQuantity: SkuProductMetric[];
}

export interface FinancialAnalytics {
  totalReturnValue: number;
  averageReturnValue: number;
  highestReturnValue: number;
  lowestReturnValue: number;
  valueBySku: { sku: string; value: number }[];
  valueByReason: { reason: string; value: number }[];
  valueByReturnType: { type: string; label: string; value: number }[];
}

export interface TimelineDataPoint {
  date: string;
  timestamp: number;
  count: number;
  totalValue: number;
}

export interface TimelineAnalytics {
  startDate: string | null;
  endDate: string | null;
  daily: TimelineDataPoint[];
  weekly: TimelineDataPoint[];
  monthly: TimelineDataPoint[];
}

export interface AgingBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface AgingAnalytics {
  averagePendingDays: number;
  overdueCount: number;
  overduePercentage: number;
  buckets: AgingBucket[];
}

export interface VendorMetric {
  vendorName: string;
  count: number;
  percentage: number;
  totalValue: number;
  customerReturns: number;
  courierReturns: number;
}

export interface LogisticsAnalytics {
  fulfillmentType: string;
  isSingleFfType: boolean;
  shipmentType: string;
  isSingleShipmentType: boolean;
  vendors: VendorMetric[];
  hasTrackingCount: number;
  isPickedUpCount: number;
  isOutForDeliveryCount: number;
}

export interface LocationMetric {
  locationId: string;
  locationName: string;
  count: number;
  totalValue: number;
}

export interface LocationAnalytics {
  isSingleLocation: boolean;
  primaryLocation: LocationMetric | null;
  locations: LocationMetric[];
}

export interface CustomerAnalytics {
  hasData: boolean;
  recordsWithGstin: number;
  recordsWithCompanyName: number;
  orderTypes: { orderType: string; count: number }[];
}

export interface InvoiceAnalytics {
  hasData: boolean;
  recordsWithInvoice: number;
  recordsWithIrn: number;
}

export interface OperationalAnalytics {
  hasData: boolean;
  recordsWithFlyer: number;
  recordsWithObd: number;
  recordsWithProof: number;
}

export interface CommentsAnalytics {
  hasData: boolean;
  totalComments: number;
  returnsWithComments: number;
  returnsWithoutComments: number;
  totalWithComments: number;
  totalWithoutComments: number;
  items: { returnId: string; comments: string }[];
}

export interface IdentityAnalytics {
  uniqueOrders: number;
  uniqueReturns: number;
  uniqueShipments: number;
  uniqueTrackingIds: number;
  uniqueSkus: number;
  uniqueFsns: number;
}

/**
 * Composite Domain Analytics Root
 */
export interface ReturnAnalytics {
  overview: OverviewAnalytics;
  identity: IdentityAnalytics;
  product: ProductAnalytics;
  financial: FinancialAnalytics;
  status: ReturnStatusAnalytics;
  completion: CompletionStatusAnalytics;
  returnType: ReturnTypeAnalytics;
  reason: ReasonAnalytics;
  subReason: SubReasonAnalytics;
  timeline: TimelineAnalytics;
  logistics: LogisticsAnalytics;
  location: LocationAnalytics;
  customer: CustomerAnalytics;
  invoice: InvoiceAnalytics;
  operational: OperationalAnalytics;
  comments: CommentsAnalytics;
  aging: AgingAnalytics;
}
