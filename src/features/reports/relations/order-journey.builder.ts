import { OrderPnlRecord, SkuPnlRecord, PnlReport } from "@/features/pnl/types/pnl.types";
import { SkuPnlAnalytics, SkuPnlRankings } from "@/features/pnl/types/pnl-analytics.types";
import { ReturnRecord } from "@/features/returns/types/return.types";
import {
  OrderJourney,
  OrderJourneyItem,
  JourneyTimelineEvent,
  OrderJourneyItemFinancials,
  SettlementTransaction,
} from "../types/journey.types";

/**
 * Cleans string for case-insensitive lookup matching
 */
function cleanKey(val: string | null | undefined): string {
  return String(val || "").trim().toLowerCase();
}

/**
 * Builds chronological timeline events for an order item journey
 */
export function buildItemTimeline(
  orderPnl?: OrderPnlRecord | null,
  returnRecord?: ReturnRecord | null,
  transactions?: SettlementTransaction[]
): JourneyTimelineEvent[] {
  const events: JourneyTimelineEvent[] = [];

  // 1. ORDER_CREATED
  const orderDate = orderPnl?.orderDate || (returnRecord?.invoiceDate ? returnRecord.invoiceDate.toISOString().slice(0, 10) : null);
  if (orderDate) {
    events.push({
      stage: "ORDER_CREATED",
      title: "Order Placed",
      subtitle: "Customer order confirmed on Flipkart",
      date: orderDate,
      status: "completed",
      badgeText: orderPnl?.channelOfSale || "Flipkart Marketplace",
      description: orderPnl ? `Mode: ${orderPnl.modeOfPayment || "Prepaid"} • Fulfillment: ${orderPnl.fulfillmentType || "Standard"}` : undefined,
    });
  }

  // 2. ORDER_STATUS
  const orderStatus = orderPnl?.orderStatus || (returnRecord ? "Fulfilled" : "Completed");
  const isCancelled = orderStatus.toLowerCase().includes("cancel") || (orderPnl && orderPnl.cancelledUnits > 0);
  events.push({
    stage: isCancelled ? "ORDER_CANCELLED" : "ORDER_DELIVERED",
    title: isCancelled ? "Order Cancelled" : "Order Delivered",
    subtitle: isCancelled ? "Order cancelled prior to final delivery" : "Delivered to customer",
    date: orderDate,
    status: isCancelled ? "cancelled" : "completed",
    badgeText: orderStatus,
  });

  // 3. RETURN LIFECYCLE (if return record exists)
  if (returnRecord) {
    if (returnRecord.returnRequestedDate) {
      events.push({
        stage: "RETURN_REQUESTED",
        title: "Return Requested",
        subtitle: `Reason: ${returnRecord.returnReason || "Customer Return"}`,
        date: returnRecord.returnRequestedDate,
        status: "completed",
        badgeText: returnRecord.returnType || "Customer Return",
        description: returnRecord.returnSubReason
          ? `Sub-reason: ${returnRecord.returnSubReason}`
          : undefined,
        meta: {
          comments: returnRecord.comments,
          returnId: returnRecord.returnId,
        },
      });
    }

    if (returnRecord.returnApprovalDate) {
      events.push({
        stage: "RETURN_APPROVED",
        title: "Return Approved",
        subtitle: "Reverse pickup initiated",
        date: returnRecord.returnApprovalDate,
        status: "completed",
      });
    }

    if (returnRecord.pickedUpDate) {
      events.push({
        stage: "RETURN_PICKED_UP",
        title: "Picked Up by Courier",
        subtitle: returnRecord.trackingId ? `Tracking ID: ${returnRecord.trackingId}` : undefined,
        date: returnRecord.pickedUpDate,
        status: "completed",
      });
    }

    if (returnRecord.outForDeliveryDate) {
      events.push({
        stage: "RETURN_OUT_FOR_DELIVERY",
        title: "Out for Return Delivery",
        subtitle: "In transit back to seller warehouse",
        date: returnRecord.outForDeliveryDate,
        status: "in_progress",
      });
    }

    if (returnRecord.completedDate || returnRecord.returnDeliveryPromiseDate) {
      events.push({
        stage: returnRecord.completedDate ? "RETURN_COMPLETED" : "RETURN_DELIVERED",
        title: returnRecord.completedDate ? "Return Completed" : "Return Delivered",
        subtitle: returnRecord.completionStatus ? `Status: ${returnRecord.completionStatus}` : "Received at warehouse",
        date: returnRecord.completedDate || returnRecord.returnDeliveryPromiseDate,
        status: "completed",
        badgeText: returnRecord.completionStatus || returnRecord.returnStatus || undefined,
        description: returnRecord.comments ? `Comments: ${returnRecord.comments}` : undefined,
      });
    }
  }

  // 4. SETTLEMENT TRANSACTIONS
  if (transactions && transactions.length > 0) {
    transactions.forEach((tx) => {
      if (tx.paymentDate || tx.transactionAmount !== 0) {
        events.push({
          stage: "SETTLEMENT_PROCESSED",
          title: `Settlement #${tx.transactionIndex}`,
          subtitle: `${tx.reason} • Status: ${tx.currentStatus}`,
          date: tx.paymentDate,
          status: "completed",
          badgeText: `₹${tx.transactionAmount.toLocaleString()}`,
          description: tx.neftId ? `NEFT Ref: ${tx.neftId} (${tx.accountType || "Bank"})` : undefined,
        });
      }
    });
  }

  return events;
}

/**
 * Builds financials object from P&L record (or fallback from return record)
 */
export function buildItemFinancials(orderPnl?: OrderPnlRecord | null, returnRecord?: ReturnRecord | null): OrderJourneyItemFinancials {
  if (orderPnl) {
    return {
      orderItemValue: orderPnl.orderItemValue,
      finalSellingPrice: orderPnl.finalSellingPrice,
      sellerFundedDiscount: orderPnl.sellerFundedDiscount,
      totalCustomerDiscount: orderPnl.totalCustomerDiscount,
      handlingFee: orderPnl.handlingFee,
      estimatedNetSales: orderPnl.estimatedNetSales,
      accountedNetSales: orderPnl.accountedNetSales,
      grossSaleValue: orderPnl.grossSaleValue,

      totalExpenses: orderPnl.totalExpenses,
      expensesBreakup: {
        commissionFee: orderPnl.commissionFee,
        collectionFee: orderPnl.collectionFee,
        fixedFee: orderPnl.fixedFee,
        pickAndPackFee: orderPnl.pickAndPackFee,
        forwardShippingFee: orderPnl.forwardShippingFee,
        reverseShippingFee: orderPnl.reverseShippingFee,
        storageFee: orderPnl.storageFee,
        recallFee: orderPnl.recallFee,
        productCancellationFee: orderPnl.productCancellationFee,
        noCostEmiFeeReimbursement: orderPnl.noCostEmiFeeReimbursement,
        installationFee: orderPnl.installationFee,
        techVisitFee: orderPnl.techVisitFee,
        uninstallationPackagingFee: orderPnl.uninstallationPackagingFee,
        customerAddOnsAmountRecovery: orderPnl.customerAddOnsAmountRecovery,
        franchiseFee: orderPnl.franchiseFee,
        shopsyMarketingFee: orderPnl.shopsyMarketingFee,
        offerAdjustments: orderPnl.offerAdjustments,
      },

      taxes: {
        gst: orderPnl.taxesGst,
        tcs: orderPnl.taxesTcs,
        tds: orderPnl.taxesTds,
      },

      totalBenefits: orderPnl.totalBenefits,
      benefitsBreakup: {
        rewards: orderPnl.rewards,
        orderSpf: orderPnl.spfPayout,
        nonOrderSpf: 0,
      },

      bankSettlementProjected: orderPnl.bankSettlementProjected,
      inputTaxCredits: orderPnl.inputTaxCredits,
      netEarnings: orderPnl.netEarnings,
      amountSettled: orderPnl.amountSettled,
      amountPending: orderPnl.amountPending,
    };
  }

  // Fallback from Returns Record if P&L not uploaded
  const price = returnRecord?.totalPrice || 0;
  return {
    orderItemValue: price,
    finalSellingPrice: price,
    sellerFundedDiscount: 0,
    totalCustomerDiscount: 0,
    handlingFee: 0,
    estimatedNetSales: price,
    accountedNetSales: price,
    grossSaleValue: price,
    totalExpenses: 0,
    expensesBreakup: {
      commissionFee: 0,
      collectionFee: 0,
      fixedFee: 0,
      pickAndPackFee: 0,
      forwardShippingFee: 0,
      reverseShippingFee: 0,
    },
    taxes: { gst: 0, tcs: 0, tds: 0 },
    totalBenefits: 0,
    benefitsBreakup: { rewards: 0, orderSpf: 0, nonOrderSpf: 0 },
    bankSettlementProjected: 0,
    inputTaxCredits: 0,
    netEarnings: 0,
    amountSettled: 0,
    amountPending: 0,
  };
}

/**
 * Builds Complete Order Journey for a specific Order ID or Order Item ID
 */
export function buildOrderJourney(
  identifier: string,
  options: {
    pnlReport?: PnlReport | null;
    returnsRecords?: ReturnRecord[] | null;
    skusRanking?: SkuPnlRankings | null;
  }
): OrderJourney | null {
  if (!identifier) return null;

  const target = cleanKey(identifier);
  const { pnlReport, returnsRecords, skusRanking } = options;

  // 1. Gather all P&L records matching this Order ID or Order Item ID
  const matchedPnlOrders: OrderPnlRecord[] = [];
  if (pnlReport && pnlReport.orders) {
    pnlReport.orders.forEach((o) => {
      if (cleanKey(o.orderId) === target || cleanKey(o.orderItemId) === target) {
        matchedPnlOrders.push(o);
      }
    });
  }

  // 2. Gather all Returns records matching this Order ID or Order Item ID
  const matchedReturns: ReturnRecord[] = [];
  if (returnsRecords) {
    returnsRecords.forEach((r) => {
      if (cleanKey(r.orderId) === target || cleanKey(r.orderItemId) === target || cleanKey(r.returnId) === target) {
        matchedReturns.push(r);
      }
    });
  }

  if (matchedPnlOrders.length === 0 && matchedReturns.length === 0) {
    return null;
  }

  // Derive root Order ID and Date
  const rootOrderId = matchedPnlOrders[0]?.orderId || matchedReturns[0]?.orderId || identifier;
  const rootOrderDate =
    matchedPnlOrders[0]?.orderDate ||
    (matchedReturns[0]?.invoiceDate ? matchedReturns[0].invoiceDate.toISOString().slice(0, 10) : null);

  // Group by Order Item ID
  const itemMap = new Map<string, { pnl?: OrderPnlRecord; return?: ReturnRecord }>();

  matchedPnlOrders.forEach((pnl) => {
    const key = cleanKey(pnl.orderItemId);
    const existing = itemMap.get(key) || {};
    existing.pnl = pnl;
    itemMap.set(key, existing);
  });

  matchedReturns.forEach((ret) => {
    const key = cleanKey(ret.orderItemId || ret.orderId);
    const existing = itemMap.get(key) || {};
    existing.return = ret;
    itemMap.set(key, existing);
  });

  // SKU analytics map for context lookup
  const skuLookupMap = new Map<string, SkuPnlAnalytics>();
  if (skusRanking && skusRanking.allSkus) {
    skusRanking.allSkus.forEach((sku) => {
      skuLookupMap.set(cleanKey(sku.sku), sku);
    });
  }

  const items: OrderJourneyItem[] = [];
  let totalSellingPrice = 0;
  let totalNetEarnings = 0;
  let totalAmountSettled = 0;
  let totalAmountPending = 0;
  let hasAnyReturn = false;

  itemMap.forEach((entry, itemKey) => {
    const pnl = entry.pnl;
    const ret = entry.return;

    const sku = pnl?.sku || ret?.sku || null;
    const skuPerformance = sku ? skuLookupMap.get(cleanKey(sku)) || null : null;
    const orderItemId = pnl?.orderItemId || ret?.orderItemId || itemKey;
    const orderStatus = pnl?.orderStatus || (ret ? "Returned" : "Completed");
    console.log('pnl :>> ', pnl);
    console.log('ret :>> ', ret);

    const financials = buildItemFinancials(pnl, ret);
    const transactions = pnl?.transactions || [];
    const timeline = buildItemTimeline(pnl, ret, transactions);

    const hasReturn = Boolean(ret);
    if (hasReturn) hasAnyReturn = true;

    totalSellingPrice += financials.finalSellingPrice;
    totalNetEarnings += financials.netEarnings;
    totalAmountSettled += financials.amountSettled;
    totalAmountPending += financials.amountPending;

    items.push({
      orderItemId,
      orderId: rootOrderId,
      sku,
      orderStatus,
      fulfillmentType: pnl?.fulfillmentType || ret?.ffType || null,
      channelOfSale: pnl?.channelOfSale || null,
      modeOfPayment: pnl?.modeOfPayment || null,
      grossUnits: pnl?.grossUnits || (ret?.quantity ? Number(ret.quantity) : 1),
      returnedCancelledUnits: pnl?.returnedCancelledUnits || (ret ? 1 : 0),
      netUnits: pnl?.netUnits || (ret ? 0 : 1),
      orderPnlRecord: pnl || null,
      returnRecord: ret || null,
      skuPerformance,
      financials,
      transactions,
      timeline,
      hasReturn,
      hasPnl: Boolean(pnl),
    });
  });

  return {
    orderId: rootOrderId,
    orderDate: rootOrderDate,
    items,
    totalSellingPrice,
    totalNetEarnings,
    totalAmountSettled,
    totalAmountPending,
    hasReturn: hasAnyReturn,
    hasPnl: Boolean(pnlReport),
    itemsCount: items.length,
  };
}
