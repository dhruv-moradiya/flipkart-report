import { OrderPnlRecord, SkuPnlRecord, SettlementTransaction } from "./pnl.models";
import { SkuPnlAnalytics } from "@/features/pnl/types/pnl-analytics.types";
import { ReturnRecord } from "./returns.models";

export type TimelineEventStage =
  | "ORDER_CREATED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_PICKED_UP"
  | "RETURN_OUT_FOR_DELIVERY"
  | "RETURN_DELIVERED"
  | "RETURN_COMPLETED"
  | "SETTLEMENT_PROCESSED";

export interface JourneyTimelineEvent {
  stage: TimelineEventStage;
  title: string;
  subtitle?: string;
  date: string | Date | null;
  status: "completed" | "in_progress" | "pending" | "cancelled" | "info";
  description?: string;
  badgeText?: string;
  meta?: Record<string, string | number | null | undefined>;
}

export interface OrderFinancialSummary {
  orderItemValue: number;
  finalSellingPrice: number;
  sellerFundedDiscount: number;
  totalCustomerDiscount: number;
  handlingFee: number;
  estimatedNetSales: number;
  accountedNetSales: number;
  grossSaleValue: number;

  totalExpenses: number;
  expensesBreakup: {
    commissionFee: number;
    collectionFee: number;
    fixedFee: number;
    pickAndPackFee: number;
    forwardShippingFee: number;
    reverseShippingFee: number;
    storageFee?: number;
    recallFee?: number;
    productCancellationFee?: number;
    noCostEmiFeeReimbursement?: number;
    installationFee?: number;
    techVisitFee?: number;
    uninstallationPackagingFee?: number;
    customerAddOnsAmountRecovery?: number;
    franchiseFee?: number;
    shopsyMarketingFee?: number;
    offerAdjustments?: number;
  };

  taxes: {
    gst: number;
    tcs: number;
    tds: number;
  };

  totalBenefits: number;
  benefitsBreakup: {
    rewards: number;
    orderSpf: number;
    nonOrderSpf: number;
  };

  bankSettlementProjected: number;
  inputTaxCredits: number;
  netEarnings: number;
  amountSettled: number;
  amountPending: number;
}

export type OrderJourneyItemFinancials = OrderFinancialSummary;

export interface RelationshipMatch {
  orderItemId: string;
  matched: boolean;
  confidence: number;
  source: "order_item_id" | "order_id" | "sku" | "none";
}

export interface JourneyDiagnostic {
  type: "info" | "warning" | "missing_source";
  title: string;
  message: string;
}

export interface OrderJourneyItem {
  orderItemId: string;
  orderId: string;
  sku: string | null;
  orderStatus: string;
  fulfillmentType?: string | null;
  channelOfSale?: string | null;
  modeOfPayment?: string | null;

  grossUnits: number;
  returnedCancelledUnits: number;
  netUnits: number;

  // Source Records
  orderPnlRecord?: OrderPnlRecord | null;
  returnRecord?: ReturnRecord | null;
  skuPerformance?: SkuPnlAnalytics | null;

  // Computed Journey Sub-models
  financials: OrderFinancialSummary;
  transactions: SettlementTransaction[];
  timeline: JourneyTimelineEvent[];
  relationship?: RelationshipMatch;

  hasReturn: boolean;
  hasPnl: boolean;
}

export interface OrderJourney {
  orderId: string;
  orderDate: string | null;
  items: OrderJourneyItem[];

  // Aggregated Order totals
  totalSellingPrice: number;
  totalNetEarnings: number;
  totalAmountSettled: number;
  totalAmountPending: number;
  hasReturn: boolean;
  hasPnl: boolean;
  itemsCount: number;
  diagnostics?: JourneyDiagnostic[];
}
