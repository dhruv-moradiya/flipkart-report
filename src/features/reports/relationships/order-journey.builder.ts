import { OrderPnlRecord, SkuPnlRecord, PnlReport, SettlementTransaction } from "../models/pnl.models";
import { SkuPnlAnalytics, SkuPnlRankings } from "@/features/pnl/types/pnl-analytics.types";
import { ReturnRecord } from "../models/returns.models";
import {
  OrderJourney,
  OrderJourneyItem,
  JourneyTimelineEvent,
  OrderFinancialSummary,
  RelationshipMatch,
  JourneyDiagnostic,
} from "../models/journey.models";

function cleanKey(val: string | null | undefined): string {
  return String(val || "").trim().toLowerCase();
}

/**
 * Builds chronological timeline events for an order item journey strictly from actual recorded events
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
      description: orderPnl
        ? `Payment: ${orderPnl.modeOfPayment || "Prepaid"} • Fulfillment: ${orderPnl.fulfillmentType || "Standard"}`
        : undefined,
    });
  }

  // 2. ORDER_STATUS
  const orderStatus = orderPnl?.orderStatus || (returnRecord ? "Fulfilled" : "Completed");
  const isCancelled =
    orderStatus.toLowerCase().includes("cancel") || (orderPnl && orderPnl.cancelledUnits > 0);

  events.push({
    stage: isCancelled ? "ORDER_CANCELLED" : "ORDER_DELIVERED",
    title: isCancelled ? "Order Cancelled" : "Order Delivered",
    subtitle: isCancelled ? "Order cancelled prior to final delivery" : "Delivered to customer",
    date: orderDate,
    status: isCancelled ? "cancelled" : "completed",
    badgeText: orderStatus,
  });

  // 3. RETURN LIFECYCLE (Only from actual Returns report records - NEVER fabricated)
  if (returnRecord) {
    if (returnRecord.returnRequestedDate) {
      events.push({
        stage: "RETURN_REQUESTED",
        title: "Return Requested",
        subtitle: `Reason: ${returnRecord.returnReason || "Customer Return"}`,
        date: returnRecord.returnRequestedDate,
        status: "completed",
        badgeText: returnRecord.returnType || "Customer Return",
        description: returnRecord.returnSubReason ? `Sub-reason: ${returnRecord.returnSubReason}` : undefined,
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
        subtitle: returnRecord.completionStatus
          ? `Status: ${returnRecord.completionStatus}`
          : "Received at warehouse",
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
export function buildItemFinancials(
  orderPnl?: OrderPnlRecord | null,
  returnRecord?: ReturnRecord | null
): OrderFinancialSummary {
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

  // Fallback if P&L is not uploaded
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

function findMatchingPnl(
  ret: ReturnRecord,
  pnlOrders: OrderPnlRecord[]
): {
  pnl?: OrderPnlRecord;
  source: "order_item_id" | "shipment_id" | "return_id" | "tracking_id" | "order_id" | "none";
} {
  // 1. Order Item ID Match
  const retItemId = cleanKey(ret.orderItemId);
  if (retItemId) {
    const found = pnlOrders.find((o) => cleanKey(o.orderItemId) === retItemId);
    if (found) return { pnl: found, source: "order_item_id" };
  }

  // Helper function to check rawRecord fields
  const checkRaw = (o: OrderPnlRecord, field: string, val: string): boolean => {
    if (!o.rawRecord) return false;
    const targetVal = cleanKey(val);
    if (!targetVal) return false;
    return Object.entries(o.rawRecord).some(([k, v]) => {
      const cleanK = cleanKey(k);
      return (
        (cleanK.includes(field) || field.includes(cleanK)) &&
        cleanKey(String(v)) === targetVal
      );
    });
  };

  // 2. Shipment ID Match
  if (ret.shipmentId) {
    const found = pnlOrders.find((o) => checkRaw(o, "shipment", ret.shipmentId));
    if (found) return { pnl: found, source: "shipment_id" };
  }

  // 3. Return ID Match
  if (ret.returnId) {
    const found = pnlOrders.find(
      (o) => checkRaw(o, "return id", ret.returnId) || checkRaw(o, "returnid", ret.returnId)
    );
    if (found) return { pnl: found, source: "return_id" };
  }

  // 4. Tracking ID Match
  if (ret.trackingId) {
    const found = pnlOrders.find((o) => checkRaw(o, "tracking", ret.trackingId));
    if (found) return { pnl: found, source: "tracking_id" };
  }

  // 5. Order ID Match (Fallback)
  const retOrderId = cleanKey(ret.orderId);
  if (retOrderId) {
    const found = pnlOrders.find((o) => cleanKey(o.orderId) === retOrderId);
    if (found) return { pnl: found, source: "order_id" };
  }

  return { source: "none" };
}

/**
 * Builds Complete Order Journey connecting P&L and Returns via Order Item ID
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

  // Resolve target to orderId first, to support querying by item ID or return ID and fetching all items of that order
  let targetOrderId = target;
  if (pnlReport && pnlReport.orders) {
    const found = pnlReport.orders.find((o) => cleanKey(o.orderItemId) === target);
    if (found) {
      targetOrderId = cleanKey(found.orderId);
    }
  }
  if (targetOrderId === target && returnsRecords) {
    const found = returnsRecords.find(
      (r) => cleanKey(r.orderItemId) === target || cleanKey(r.returnId) === target
    );
    if (found && found.orderId) {
      targetOrderId = cleanKey(found.orderId);
    }
  }

  // 1. Gather all P&L records matching this resolved Order ID
  const matchedPnlOrders: OrderPnlRecord[] = [];
  if (pnlReport && pnlReport.orders) {
    pnlReport.orders.forEach((o) => {
      if (cleanKey(o.orderId) === targetOrderId) {
        matchedPnlOrders.push(o);
      }
    });
  }

  // 2. Gather all Returns records matching this resolved Order ID
  const matchedReturns: ReturnRecord[] = [];
  if (returnsRecords) {
    returnsRecords.forEach((r) => {
      if (cleanKey(r.orderId) === targetOrderId) {
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

  // Group by Order Item ID (1 Order ID -> N Order Items)
  const itemMap = new Map<
    string,
    {
      pnl?: OrderPnlRecord;
      return?: ReturnRecord;
      matchSource: "order_item_id" | "shipment_id" | "return_id" | "tracking_id" | "order_id" | "none";
    }
  >();

  // Pass 1: Add PnL order items
  matchedPnlOrders.forEach((pnl) => {
    const itemKey = cleanKey(pnl.orderItemId);
    itemMap.set(itemKey, { pnl, matchSource: "none" });
  });

  // Pass 2: Match Returns records using the preferred matching hierarchy
  matchedReturns.forEach((ret) => {
    const { pnl, source } = findMatchingPnl(ret, matchedPnlOrders);
    if (pnl) {
      const itemKey = cleanKey(pnl.orderItemId);
      const existing = itemMap.get(itemKey)!;
      existing.return = ret;
      existing.matchSource = source;
    } else {
      // If order item not found, create a return-only item
      const itemKey = cleanKey(ret.orderItemId) || cleanKey(ret.returnId) || cleanKey(ret.orderId);
      const existing = itemMap.get(itemKey) || { matchSource: "none" };
      existing.return = ret;
      existing.matchSource = source;
      itemMap.set(itemKey, existing);
    }
  });

  // SKU analytics map for portfolio context lookup
  const skuLookupMap = new Map<string, SkuPnlAnalytics>();
  if (skusRanking && skusRanking.allSkus) {
    skusRanking.allSkus.forEach((sku) => {
      skuLookupMap.set(cleanKey(sku.sku), sku);
    });
  }

  const items: OrderJourneyItem[] = [];
  const diagnostics: JourneyDiagnostic[] = [];

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

    const financials = buildItemFinancials(pnl, ret);
    const transactions = pnl?.transactions || [];
    const timeline = buildItemTimeline(pnl, ret, transactions);

    const hasReturn = Boolean(ret);
    if (hasReturn) hasAnyReturn = true;

    totalSellingPrice += financials.finalSellingPrice;
    totalNetEarnings += financials.netEarnings;
    totalAmountSettled += financials.amountSettled;
    totalAmountPending += financials.amountPending;

    const confidenceMap: Record<string, number> = {
      order_item_id: 1.0,
      shipment_id: 0.9,
      return_id: 0.8,
      tracking_id: 0.7,
      order_id: 0.5,
      none: 0.0,
    };

    const relationship: RelationshipMatch = {
      orderItemId,
      matched: Boolean(pnl && ret),
      confidence: confidenceMap[entry.matchSource] || 0.0,
      source: entry.matchSource,
    };

    // Diagnostic if P&L indicates return but detailed return record was not uploaded/found
    if (pnl && (pnl.rvpUnits > 0 || pnl.returnedCancelledUnits > 0) && !ret) {
      diagnostics.push({
        type: "missing_source",
        title: "Detailed Return Record Not Found",
        message: `P&L indicates customer/courier return for item "${orderItemId}", but detailed reverse tracking record was not found in the uploaded Returns report.`,
      });
    }

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
      relationship,
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
    diagnostics,
  };
}
