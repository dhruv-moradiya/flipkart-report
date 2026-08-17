import {
  PnlReport,
  SkuPnlRecord,
  OrderPnlRecord,
} from "@/features/reports/models/pnl.models";
import { ReturnRecord } from "@/features/reports/models/returns.models";
import {
  getOverviewMetrics,
  getOverviewFinancialComparison,
  getOverviewUnitsComparison,
} from "../calculations/overview";
import {
  getTopSkusByEarnings,
  getTopSkusBySales,
  getTopSkusByExpenseMagnitude,
  getTopSkusByReturnRate,
  getSkuEarningsPerUnit,
} from "../calculations/sku";
import {
  getTopProductsByCustomerReturns,
  getTopProductsByCancellations,
  getTopProductsByRto,
} from "../calculations/products";
import {
  getOrdersByStatus,
  getOrdersByPaymentMode,
  getOrdersByChannel,
} from "../calculations/orders";
import {
  getTopReturnReasons,
  getTopReturnSubReasons,
  getReturnTypeDistribution,
} from "../calculations/returns";
import {
  getFinancialFunnelProgression,
  getSettlementBalance,
} from "../calculations/financials";
import {
  getAllFeeCategoriesAggregated,
  getSkuFeeBreakdown,
  getShippingCostComparison,
} from "../calculations/fees";
import {
  getSettlementComparison,
  getTransactionsByStatus,
} from "../calculations/settlements";
import {
  getSalesVsReturnRateScatter,
  getEarningsVsReturnRateScatter,
} from "../calculations/cross-report";

function runAnalyticsCalculationsTests() {
  console.log(
    "=================================================================",
  );
  console.log(
    "🚀 Running Flipkart Multi-Route Analytics Calculations Test Suite",
  );
  console.log(
    "=================================================================",
  );

  // Mock SKU records
  const mockSkus: SkuPnlRecord[] = [
    {
      sku: "SKU-A-TOP-EARNER",
      grossUnits: 100,
      returnedCancelledUnits: 10,
      rtoUnits: 3,
      rvpUnits: 5,
      cancelledUnits: 2,
      netUnits: 90,
      estimatedNetSales: 90000,
      orderItemValue: 100000,
      accountedNetSales: 90000,
      totalExpenses: -18000,
      expenses: {
        commissionFee: -9000,
        collectionFee: -1800,
        fixedFee: -2000,
        pickAndPackFee: -1000,
        forwardShippingFee: -2500,
        reverseShippingFee: -800,
        storageFee: -100,
        recallFee: -50,
        noCostEmiFeeReimbursement: 0,
        installationFee: 0,
        techVisitFee: 0,
        uninstallationPackagingFee: 0,
        customerAddonsRecovery: 0,
        franchiseFee: 0,
        shopsyMarketingFee: 0,
        offerAdjustments: 0,
        productCancellationFee: 0,
        gst: -650,
        tcs: -80,
        tds: -20,
      },
      commissionFee: -9000,
      collectionFee: -1800,
      fixedFee: -2000,
      pickAndPackFee: -1000,
      forwardShippingFee: -2500,
      reverseShippingFee: -800,
      storageFee: -100,
      recallFee: -50,
      productCancellationFee: 0,
      offerAdjustments: 0,
      noCostEmiFeeReimbursement: 0,
      installationFee: 0,
      techVisitFee: 0,
      uninstallationPackagingFee: 0,
      customerAddOnsAmountRecovery: 0,
      franchiseFee: 0,
      shopsyMarketingFee: 0,
      taxesGst: -650,
      taxesTcs: -80,
      taxesTds: -20,
      rewards: 500,
      orderSpf: 0,
      nonOrderSpf: 0,
      totalBenefits: 500,
      bankSettlement: 72500,
      inputTaxCredits: 750,
      itcGstTcs: 650,
      itcTds: 100,
      netEarnings: 73250,
      earningsPerUnit: 813.88,
      amountSettled: 70000,
      amountPending: 2500,
    },
    {
      sku: "SKU-B-HIGH-RETURNS",
      grossUnits: 50,
      returnedCancelledUnits: 25,
      rtoUnits: 10,
      rvpUnits: 12,
      cancelledUnits: 3,
      netUnits: 25,
      estimatedNetSales: 25000,
      orderItemValue: 50000,
      accountedNetSales: 25000,
      totalExpenses: -12000,
      expenses: {
        commissionFee: -3000,
        collectionFee: -600,
        fixedFee: -1000,
        pickAndPackFee: -500,
        forwardShippingFee: -3500,
        reverseShippingFee: -2800,
        storageFee: 0,
        recallFee: 0,
        noCostEmiFeeReimbursement: 0,
        installationFee: 0,
        techVisitFee: 0,
        uninstallationPackagingFee: 0,
        customerAddonsRecovery: 0,
        franchiseFee: 0,
        shopsyMarketingFee: 0,
        offerAdjustments: 0,
        productCancellationFee: 0,
        gst: -500,
        tcs: -80,
        tds: -20,
      },
      commissionFee: -3000,
      collectionFee: -600,
      fixedFee: -1000,
      pickAndPackFee: -500,
      forwardShippingFee: -3500,
      reverseShippingFee: -2800,
      storageFee: 0,
      recallFee: 0,
      productCancellationFee: 0,
      offerAdjustments: 0,
      noCostEmiFeeReimbursement: 0,
      installationFee: 0,
      techVisitFee: 0,
      uninstallationPackagingFee: 0,
      customerAddOnsAmountRecovery: 0,
      franchiseFee: 0,
      shopsyMarketingFee: 0,
      taxesGst: -500,
      taxesTcs: -80,
      taxesTds: -20,
      rewards: 0,
      orderSpf: 0,
      nonOrderSpf: 0,
      totalBenefits: 0,
      bankSettlement: 13000,
      inputTaxCredits: 600,
      itcGstTcs: 500,
      itcTds: 100,
      netEarnings: 13600,
      earningsPerUnit: 544,
      amountSettled: 10000,
      amountPending: 3000,
    },
  ];

  // Mock Orders
  const mockOrders: OrderPnlRecord[] = [
    {
      orderDate: "2026-07-02",
      orderId: "OD10001",
      orderItemId: "ITM10001",
      sku: "SKU-A-TOP-EARNER",
      fulfillmentType: "Flipkart Assured",
      channelOfSale: "Flipkart",
      modeOfPayment: "PREPAID",
      orderStatus: "Delivered",
      grossUnits: 1,
      returnedCancelledUnits: 0,
      rtoUnits: 0,
      rvpUnits: 0,
      cancelledUnits: 0,
      netUnits: 1,
      orderItemValue: 1000,
      finalSellingPrice: 900,
      handlingFee: 0,
      estimatedNetSales: 900,
      accountedNetSales: 900,
      grossSaleValue: 1000,
      sellerFundedDiscount: 100,
      customerAddOnsAmount: 0,
      totalCustomerDiscount: 0,
      offerId: null,
      totalExpenses: -180,
      expenses: {
        commissionFee: -90,
        collectionFee: -18,
        fixedFee: -20,
        pickAndPackFee: -10,
        forwardShippingFee: -25,
        reverseShippingFee: 0,
        storageFee: 0,
        recallFee: 0,
        noCostEmiFeeReimbursement: 0,
        installationFee: 0,
        techVisitFee: 0,
        uninstallationPackagingFee: 0,
        customerAddonsRecovery: 0,
        franchiseFee: 0,
        shopsyMarketingFee: 0,
        offerAdjustments: 0,
        productCancellationFee: 0,
        gst: -15,
        tcs: -1,
        tds: -1,
      },
      commissionFee: -90,
      collectionFee: -18,
      fixedFee: -20,
      pickAndPackFee: -10,
      forwardShippingFee: -25,
      reverseShippingFee: 0,
      storageFee: 0,
      recallFee: 0,
      productCancellationFee: 0,
      noCostEmiFeeReimbursement: 0,
      installationFee: 0,
      techVisitFee: 0,
      uninstallationPackagingFee: 0,
      customerAddOnsAmountRecovery: 0,
      franchiseFee: 0,
      shopsyMarketingFee: 0,
      offerAdjustments: 0,
      taxesGst: -15,
      taxesTcs: -1,
      taxesTds: -1,
      rewards: 0,
      spfPayout: 0,
      totalBenefits: 0,
      bankSettlementProjected: 720,
      inputTaxCredits: 17,
      itcGstTcs: 16,
      itcTds: 1,
      netEarnings: 737,
      amountSettled: 720,
      amountPending: 0,
      transactions: [
        {
          transactionIndex: 1,
          transactionAmount: 720,
          reason: "Order Settlement",
          currentStatus: "Settled",
          paymentDate: "2026-07-10",
          accountType: "Bank",
          neftId: "NEFT001",
        },
      ],
    },
    {
      orderDate: "2026-07-03",
      orderId: "OD10002",
      orderItemId: "ITM10002",
      sku: "SKU-B-HIGH-RETURNS",
      fulfillmentType: "Standard Fulfillment",
      channelOfSale: "Shopsy",
      modeOfPayment: "COD",
      orderStatus: "Returned",
      grossUnits: 1,
      returnedCancelledUnits: 1,
      rtoUnits: 0,
      rvpUnits: 1,
      cancelledUnits: 0,
      netUnits: 0,
      orderItemValue: 500,
      finalSellingPrice: 500,
      handlingFee: 0,
      estimatedNetSales: 500,
      accountedNetSales: 500,
      grossSaleValue: 500,
      sellerFundedDiscount: 0,
      customerAddOnsAmount: 0,
      totalCustomerDiscount: 0,
      offerId: null,
      totalExpenses: -240,
      expenses: {
        commissionFee: -60,
        collectionFee: -12,
        fixedFee: -20,
        pickAndPackFee: -10,
        forwardShippingFee: -70,
        reverseShippingFee: -56,
        storageFee: 0,
        recallFee: 0,
        noCostEmiFeeReimbursement: 0,
        installationFee: 0,
        techVisitFee: 0,
        uninstallationPackagingFee: 0,
        customerAddonsRecovery: 0,
        franchiseFee: 0,
        shopsyMarketingFee: 0,
        offerAdjustments: 0,
        productCancellationFee: 0,
        gst: -10,
        tcs: -1,
        tds: -1,
      },
      commissionFee: -60,
      collectionFee: -12,
      fixedFee: -20,
      pickAndPackFee: -10,
      forwardShippingFee: -70,
      reverseShippingFee: -56,
      storageFee: 0,
      recallFee: 0,
      productCancellationFee: 0,
      noCostEmiFeeReimbursement: 0,
      installationFee: 0,
      techVisitFee: 0,
      uninstallationPackagingFee: 0,
      customerAddOnsAmountRecovery: 0,
      franchiseFee: 0,
      shopsyMarketingFee: 0,
      offerAdjustments: 0,
      taxesGst: -10,
      taxesTcs: -1,
      taxesTds: -1,
      rewards: 0,
      spfPayout: 0,
      totalBenefits: 0,
      bankSettlementProjected: 260,
      inputTaxCredits: 12,
      itcGstTcs: 11,
      itcTds: 1,
      netEarnings: 272,
      amountSettled: 200,
      amountPending: 60,
      transactions: [],
    },
  ];

  const mockPnlReport: PnlReport = {
    fileName: "Flipkart_PnL_Mock.xlsx",
    fileSize: 50000,
    sheetNames: ["SKU-level P&L", "Orders P&L"],
    skuSheetName: "SKU-level P&L",
    ordersSheetName: "Orders P&L",
    skuLevel: mockSkus,
    orders: mockOrders,
    parsedAt: new Date().toISOString(),
  };

  const mockReturns: ReturnRecord[] = [
    {
      locationId: "LOC1",
      orderId: "OD10002",
      orderItemId: "ITM10002",
      returnId: "RET1",
      trackingId: "AWB1",
      shipmentId: "SHP1",
      replacementOrderItemId: null,
      sku: "SKU-B-HIGH-RETURNS",
      fsn: "FSN1",
      product: "High Return Test Product",
      totalPrice: 500,
      quantity: 1,
      ffType: "Standard",
      returnRequestedDate: new Date("2026-07-05"),
      returnApprovalDate: new Date("2026-07-06"),
      completedDate: new Date("2026-07-10"),
      outForDeliveryDate: null,
      returnDeliveryPromiseDate: null,
      pickedUpDate: new Date("2026-07-07"),
      shipmentType: "Forward",
      returnStatus: "completed",
      completionStatus: "Completed",
      returnType: "customer_return",
      returnReason: "Quality Issue",
      returnSubReason: "Defective stitching",
      comments: "Customer said stitches were loose.",
      vendorName: "Test Vendor",
      locationName: "Hub 1",
      flyerStatus: null,
      flyerCaptured: null,
      flyerActual: null,
      deliveryProofTime: null,
      obdEligible: null,
      obdStatus: null,
      obdRemarks: null,
      deliveryProofOtc: null,
      bagTrackingId: null,
      orderType: "COD",
      customerGstin: null,
      customerCompanyName: null,
      irnNumber: null,
      invoiceNumber: "INV1",
      invoiceDate: new Date("2026-07-03"),
      returnResult: "Refunded",
      returnCompletionType: "Normal",
      finalCondition: "Damaged",
      returnCompletionBreach: "No",
    },
  ];

  // 1. Test Overview Calculations
  console.log("\n▶ TEST 1: Overview Calculations");
  const overviewMetrics = getOverviewMetrics(mockPnlReport, mockReturns);
  console.log("✓ Overview Sales:", overviewMetrics.accountedNetSales);
  console.log("✓ Overview Earnings:", overviewMetrics.netEarnings);
  if (
    overviewMetrics.accountedNetSales !== 115000 ||
    overviewMetrics.netEarnings !== 86850
  ) {
    throw new Error("Overview aggregation mismatch");
  }

  // 2. Test SKU Calculations & Return Rate Safety
  console.log("\n▶ TEST 2: SKU Calculations & Return Rates");
  const topEarnings = getTopSkusByEarnings(mockSkus, 5);
  const topExpenses = getTopSkusByExpenseMagnitude(mockSkus, 5);
  const topReturnRates = getTopSkusByReturnRate(mockSkus, 5);
  const { topProfitable } = getSkuEarningsPerUnit(mockSkus, 5);

  console.log(
    "✓ Top Earner SKU:",
    topEarnings[0].label,
    "Earnings:",
    topEarnings[0].value,
  );
  console.log(
    "✓ Top Expense SKU:",
    topExpenses[0].label,
    "Magnitude:",
    topExpenses[0].value,
    "Signed:",
    topExpenses[0].secondaryValue,
  );
  console.log(
    "✓ Top Return Rate SKU:",
    topReturnRates[0].label,
    "Rate:",
    topReturnRates[0].value + "%",
  );
  console.log(
    "✓ Top EPU SKU:",
    topProfitable[0].label,
    "EPU:",
    topProfitable[0].value,
  );

  if (topEarnings[0].rawKey !== "SKU-A-TOP-EARNER")
    throw new Error("Expected SKU-A as top earner");
  if (
    topExpenses[0].value !== 18000 ||
    topExpenses[0].secondaryValue !== -18000
  )
    throw new Error("Expense magnitude or sign failed");
  if (topReturnRates[0].value !== 50)
    throw new Error(
      `Expected 50% return rate for SKU-B, got ${topReturnRates[0].value}`,
    );

  // 3. Test Products Calculations
  console.log("\n▶ TEST 3: Products Calculations");
  const topRvp = getTopProductsByCustomerReturns(mockSkus, 5);
  const topRto = getTopProductsByRto(mockSkus, 5);
  console.log(
    "✓ Top Customer Returns (RVP):",
    topRvp[0].label,
    "RVP:",
    topRvp[0].value,
  );
  console.log(
    "✓ Top Logistics Returns (RTO):",
    topRto[0].label,
    "RTO:",
    topRto[0].value,
  );
  if (topRvp[0].value !== 12 || topRto[0].value !== 10)
    throw new Error("RVP/RTO units mismatch");

  // 4. Test Orders Calculations
  console.log("\n▶ TEST 4: Orders Calculations");
  const statuses = getOrdersByStatus(mockOrders);
  const payModes = getOrdersByPaymentMode(mockOrders);
  const channels = getOrdersByChannel(mockOrders);
  console.log(
    "✓ Orders Statuses:",
    statuses.map((s) => `${s.label}: ${s.value}`),
  );
  console.log(
    "✓ Payment Modes:",
    payModes.map((p) => `${p.name}: ${p.value}`),
  );
  console.log(
    "✓ Channels:",
    channels.map((c) => `${c.label}: ${c.value}`),
  );
  if (statuses.length !== 2 || payModes.length !== 2 || channels.length !== 2) {
    throw new Error("Orders groupings mismatch");
  }

  // 5. Test Returns Calculations
  console.log("\n▶ TEST 5: Returns Calculations");
  const returnReasons = getTopReturnReasons(mockReturns, 5);
  const subReasons = getTopReturnSubReasons(mockReturns, 5);
  const retTypes = getReturnTypeDistribution(mockReturns);
  console.log("✓ Return Reason:", returnReasons[0].label);
  console.log("✓ Return Sub-Reason:", subReasons[0].label);
  console.log("✓ Return Type Distribution:", retTypes[0].name);
  if (
    returnReasons[0].label !== "Quality Issue" ||
    subReasons[0].label !== "Defective stitching"
  ) {
    throw new Error("Returns reasons mismatch");
  }

  // 6. Test Fees & Expenses Calculations
  console.log("\n▶ TEST 6: Fees & Expenses (20 Categories)");
  const allFees = getAllFeeCategoriesAggregated(mockPnlReport);
  const commBySku = getSkuFeeBreakdown(mockPnlReport, "commissionFee", 5);
  const shippingComp = getShippingCostComparison(mockPnlReport, 5);
  console.log("✓ Total Active Fee Categories:", allFees.length);
  console.log(
    "✓ Top Fee:",
    allFees[0].label,
    "Magnitude:",
    allFees[0].value,
    "Signed:",
    allFees[0].secondaryValue,
  );
  console.log(
    "✓ Commission by SKU:",
    commBySku[0].label,
    "Commission:",
    commBySku[0].value,
  );
  if (allFees.length === 0 || allFees[0].secondaryValue >= 0)
    throw new Error("Fee aggregation should preserve negative sign");

  // 7. Test Settlements & Cross-report Scatters
  console.log("\n▶ TEST 7: Settlements & Cross-Report Scatters");
  const settlementComp = getSettlementComparison(mockPnlReport);
  const salesVsReturnScatter = getSalesVsReturnRateScatter(
    mockPnlReport,
    mockReturns,
  );
  const earnVsReturnScatter = getEarningsVsReturnRateScatter(
    mockPnlReport,
    mockReturns,
  );
  console.log(
    "✓ Settlement Projected vs Settled vs Pending:",
    settlementComp.map((s) => `${s.label}: ${s.value}`),
  );
  console.log(
    "✓ Sales vs Return Rate Scatter Points:",
    salesVsReturnScatter.length,
  );
  console.log(
    "✓ Earnings vs Return Rate Scatter Points:",
    earnVsReturnScatter.length,
  );
  if (salesVsReturnScatter.length !== 2 || earnVsReturnScatter.length !== 2) {
    throw new Error("Scatter points mismatch");
  }

  console.log(
    "\n=================================================================",
  );
  console.log("🎉 ALL MULTI-ROUTE ANALYTICS CALCULATION TESTS PASSED!");
  console.log(
    "=================================================================",
  );
}

runAnalyticsCalculationsTests();
