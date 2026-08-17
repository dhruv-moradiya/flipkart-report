import { OrderPnlRecord } from "@/features/pnl/types/pnl.types";
import { SkuPnlAnalytics } from "@/features/pnl/types/pnl-analytics.types";
import { ReturnRecord } from "@/features/returns/types/return.types";

export interface SettlementTransaction {
  transactionIndex: number;
  transactionAmount: number;
  reason: string;
  currentStatus: string;
  paymentDate: string | null;
  accountType: string | null;
  neftId: string | null;
}

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

export interface OrderJourneyItemFinancials {
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
  financials: OrderJourneyItemFinancials;
  transactions: SettlementTransaction[];
  timeline: JourneyTimelineEvent[];

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
}
