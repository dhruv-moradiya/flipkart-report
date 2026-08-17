import * as XLSX from "xlsx";
import { parseSkuPnlSheet, parseOrdersPnlSheet } from "../parsers/flipkart-pnl.parser";
import { parseFlipkartReturnsFile } from "../parsers/flipkart-returns.parser";
import { buildOrderJourney } from "../relationships/order-journey.builder";
import { parseFinancialNumber, formatINR } from "../excel/value-parser";
import { parseDate, formatDate } from "../excel/date-parser";
import { detectReportType } from "../detector/report-detector";

function runResilienceTests() {
  console.log("=================================================================");
  console.log("🚀 Running Flipkart Report Ingestion Engine Resilience Test Suite");
  console.log("=================================================================");

  // =========================================================================
  // TEST 1: Value Parser Safety (Preserve Negatives, No Silent Zeroes)
  // =========================================================================
  console.log("\n▶ TEST 1: Safe Value & Negative Expense Parsing");
  const negNum1 = parseFinancialNumber("-196");
  const negNum2 = parseFinancialNumber("-196.50");
  const parenNeg = parseFinancialNumber("(220.00)");
  const currNeg = parseFinancialNumber("-₹44");
  const zeroVal = parseFinancialNumber("0");
  const emptyVal = parseFinancialNumber("");
  const unmappedVal = parseFinancialNumber(null);
  const invalidVal = parseFinancialNumber("N/A_NOT_A_NUM");

  if (negNum1.value !== -196 || negNum1.status !== "parsed") {
    throw new Error(`Failed to parse -196: got ${negNum1.value}`);
  }
  if (parenNeg.value !== -220 || parenNeg.status !== "parsed") {
    throw new Error(`Failed to parse (220.00): got ${parenNeg.value}`);
  }
  if (currNeg.value !== -44 || currNeg.status !== "parsed") {
    throw new Error(`Failed to parse -₹44: got ${currNeg.value}`);
  }
  if (zeroVal.value !== 0 || zeroVal.status !== "parsed") {
    throw new Error(`Failed to parse 0: got ${zeroVal.value}`);
  }
  if (emptyVal.value !== null || emptyVal.status !== "missing") {
    throw new Error(`Empty value must be null/missing, got: ${emptyVal.value}, ${emptyVal.status}`);
  }
  if (unmappedVal.value !== null || unmappedVal.status !== "missing") {
    throw new Error(`Null value must be null/missing, got: ${unmappedVal.value}, ${unmappedVal.status}`);
  }
  if (invalidVal.value !== null || invalidVal.status !== "invalid") {
    throw new Error(`Invalid value must be null/invalid, got: ${invalidVal.value}, ${invalidVal.status}`);
  }

  // Currency formatting assertions
  if (formatINR(-196) !== "-₹196") {
    throw new Error(`Expected formatINR(-196) to be "-₹196", got "${formatINR(-196)}"`);
  }
  if (formatINR(-220.5) !== "-₹220.50") {
    throw new Error(`Expected formatINR(-220.5) to be "-₹220.50", got "${formatINR(-220.5)}"`);
  }
  console.log("✓ Value parser strictly preserves negative numbers, decimal points, and unmapped nulls (never ₹0).");

  // =========================================================================
  // TEST 2: Safe Date Parser (Serials, ISO, DD/MM/YYYY)
  // =========================================================================
  console.log("\n▶ TEST 2: Date Parsing Resilience");
  const serialDate = parseDate(46205); // Serial date in 2026
  const isoDate = parseDate("2026-07-02T10:30:00Z");
  const dmyDate = parseDate("02/07/2026");
  const dmyHyphenDate = parseDate("16-08-2026");
  const invalidDate = parseDate("not-a-date");

  if (!serialDate.value || isNaN(serialDate.value.getTime())) {
    throw new Error("Failed to parse Excel serial date");
  }
  if (!isoDate.value || isNaN(isoDate.value.getTime())) {
    throw new Error("Failed to parse ISO date");
  }
  if (!dmyDate.value || dmyDate.value.getUTCDate() !== 2 || dmyDate.value.getUTCMonth() !== 6) {
    throw new Error(`Failed to parse DD/MM/YYYY: got ${dmyDate.value?.toISOString()}`);
  }
  if (!dmyHyphenDate.value || dmyHyphenDate.value.getUTCDate() !== 16 || dmyHyphenDate.value.getUTCMonth() !== 7) {
    throw new Error(`Failed to parse DD-MM-YYYY: got ${dmyHyphenDate.value?.toISOString()}`);
  }
  if (invalidDate.value !== null || invalidDate.status !== "invalid") {
    throw new Error("Invalid date must return null with status 'invalid'");
  }
  console.log("✓ Date parser correctly handles Excel serials, ISO strings, DD/MM/YYYY, and DD-MM-YYYY without fabricating dates.");

  // =========================================================================
  // TEST 3: Changed Column Positions & Aliases (Z = Fixed Fee, New Marketing Fee)
  // =========================================================================
  console.log("\n▶ TEST 3: Column-Position Independence & Unknown Field Retention");
  // Build a sheet where Fixed Fee is moved far to Column Z (Index 25), Commission is at Column Y (Index 24),
  // and a new unknown field "New Marketing Fee" is added at Column AA (Index 26).
  const customRow1: (string | null)[] = new Array(30).fill(null);
  const customRow2: (string | null)[] = new Array(30).fill(null);
  const customRow3: (string | number | null)[] = new Array(30).fill(null);

  // Column A (0): SKU
  customRow1[0] = "SKU ID";
  customRow2[0] = "SKU ID";
  customRow3[0] = "SKU-TEST-RESILIENT-99";

  // Column B (1): Gross Units
  customRow1[1] = "Gross Units (#)";
  customRow2[1] = null;
  customRow3[1] = 50;

  // Column C (2): Net Units
  customRow1[2] = "Net Units (#)";
  customRow2[2] = null;
  customRow3[2] = 45;

  // Column D (3): Estimated Net Sales
  customRow1[3] = "Estimated Net Sales (INR)";
  customRow2[3] = null;
  customRow3[3] = 45000;

  // Column E (4): Official Total Expenses
  customRow1[4] = "Total Expenses (INR)";
  customRow2[4] = null;
  customRow3[4] = -9000;

  // Column F (5): Net Earnings
  customRow1[5] = "Net Earnings (INR)";
  customRow2[5] = null;
  customRow3[5] = 36000;

  // Merged Range O1:AA1 -> "Total Expenses (Breakup)"
  customRow1[14] = "Total Expenses (Breakup)";

  // Column Y (24): Commission Fee (Aliased as "Marketplace Commission")
  customRow2[24] = "Marketplace Commission";
  customRow3[24] = -3600;

  // Column Z (25): Fixed Fee (Moved from Q to Z, aliased as "Fixed Charges")
  customRow2[25] = "Fixed Charges";
  customRow3[25] = -980;

  // Column AA (26): Reverse Shipping Fee
  customRow2[26] = "Reverse Shipping Fee";
  customRow3[26] = -1100;

  // Column AB (27): NEW UNKNOWN FIELD from Flipkart
  customRow1[27] = "Total Expenses (Breakup)";
  customRow2[27] = "New Marketing Promo Fee";
  customRow3[27] = -250;

  const wsCustom = XLSX.utils.aoa_to_sheet([customRow1, customRow2, customRow3]);
  wsCustom["!merges"] = [
    { s: { r: 0, c: 14 }, e: { r: 0, c: 27 } }, // O1:AB1 Merged parent
  ];
  wsCustom["!cols"] = [
    { hidden: false },
    { hidden: false },
    { hidden: false },
    { hidden: false },
    { hidden: false },
    { hidden: false },
    ...new Array(18).fill({ hidden: false }),
    { hidden: true }, // Col Y hidden
    { hidden: true }, // Col Z hidden
    { hidden: true }, // Col AA hidden
    { hidden: true }, // Col AB hidden
  ];

  const skuParsedResult = parseSkuPnlSheet(wsCustom);
  if (skuParsedResult.records.length !== 1) {
    throw new Error(`Expected 1 record, got ${skuParsedResult.records.length}`);
  }

  const parsedCustomSku = skuParsedResult.records[0];
  console.log("✓ Parsed SKU with altered column layout:", parsedCustomSku.sku);
  console.log("✓ Fixed Fee (Found at Column Z via alias):", parsedCustomSku.fixedFee);
  console.log("✓ Commission Fee (Found at Column Y via alias):", parsedCustomSku.commissionFee);
  console.log("✓ Reverse Shipping Fee:", parsedCustomSku.reverseShippingFee);

  if (parsedCustomSku.fixedFee !== -980) {
    throw new Error(`Expected fixedFee to be -980, got ${parsedCustomSku.fixedFee}`);
  }
  if (parsedCustomSku.commissionFee !== -3600) {
    throw new Error(`Expected commissionFee to be -3600, got ${parsedCustomSku.commissionFee}`);
  }
  if (parsedCustomSku.totalExpenses !== -9000) {
    throw new Error(`Expected totalExpenses to be -9000, got ${parsedCustomSku.totalExpenses}`);
  }

  // Check unknown field detection & raw preservation
  console.log("✓ Unknown fields detected:", skuParsedResult.unknownKeys);
  const unknownMap = parsedCustomSku.unknownFields || {};
  console.log("✓ Unknown field values preserved:", unknownMap);
  const hasPromoFee = Object.keys(unknownMap).some((k) => k.includes("New Marketing Promo Fee"));
  if (!hasPromoFee) {
    throw new Error("Expected 'New Marketing Promo Fee' to be preserved in unknownFields");
  }
  console.log("✓ Layout resilience & unknown field preservation verified successfully!");

  // =========================================================================
  // TEST 4: Cross-Report Order Journey Join (Primary: Order Item ID) & Comments
  // =========================================================================
  console.log("\n▶ TEST 4: Cross-Report Order Journey via Order Item ID & Verbatim Comments");

  // Orders P&L row
  const pnlOrderRow: Record<string, unknown> = {
    orderDate: "2026-07-02",
    orderId: "OD100200300400",
    orderItemId: "ITEM_9988776655",
    sku: "SKU-SILICONE-SPLASH-01",
    fulfillmentType: "Flipkart Assured",
    channelOfSale: "Flipkart",
    modeOfPayment: "Prepaid UPI",
    orderStatus: "Completed",
    grossUnits: 1,
    returnedCancelledUnits: 1,
    rtoUnits: 0,
    rvpUnits: 1,
    cancelledUnits: 0,
    netUnits: 0,
    orderItemValue: 499,
    finalSellingPrice: 449,
    handlingFee: 0,
    estimatedNetSales: 449,
    accountedNetSales: 449,
    grossSaleValue: 499,
    sellerFundedDiscount: 50,
    customerAddOnsAmount: 0,
    totalCustomerDiscount: 0,
    offerId: null,
    totalExpenses: -115,
    expenses: {
      commissionFee: -50,
      collectionFee: -10,
      fixedFee: -25,
      pickAndPackFee: -10,
      forwardShippingFee: -20,
      offerAdjustments: 0,
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
      productCancellationFee: 0,
      gst: 0,
      tcs: 0,
      tds: 0,
    },
    commissionFee: -50,
    collectionFee: -10,
    fixedFee: -25,
    pickAndPackFee: -10,
    forwardShippingFee: -20,
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
    taxesGst: 0,
    taxesTcs: 0,
    taxesTds: 0,
    rewards: 0,
    spfPayout: 0,
    totalBenefits: 0,
    bankSettlementProjected: 334,
    inputTaxCredits: 18,
    itcGstTcs: 0,
    itcTds: 0,
    netEarnings: 352,
    amountSettled: 334,
    amountPending: 0,
    transactions: [
      {
        transactionIndex: 1,
        transactionAmount: 334,
        reason: "Order Settlement",
        currentStatus: "Settled",
        paymentDate: "2026-07-10",
        accountType: "Bank Payout",
        neftId: "NEFT987654321",
      },
    ],
  };

  // Returns report row
  const verbatimCustomerComment = "Customer reported: 'Silicone splash guard torn along the suction rim during transit.'";
  const returnReportRow = {
    locationId: "LOC_HYD_02",
    orderId: "OD100200300400",
    orderItemId: "ITEM_9988776655", // Primary Key Match
    returnId: "RET_88990011",
    trackingId: "FMPR9911223344",
    shipmentId: "SHP_991122",
    replacementOrderItemId: null,
    sku: "SKU-SILICONE-SPLASH-01",
    fsn: "FSN_SIL_01",
    product: "Ultra Durable Silicone Splash Guard",
    totalPrice: 449,
    quantity: 1,
    ffType: "FA",
    returnRequestedDate: new Date("2026-08-16T00:00:00Z"),
    returnApprovalDate: new Date("2026-08-16T00:00:00Z"),
    completedDate: new Date("2026-08-20T00:00:00Z"),
    outForDeliveryDate: new Date("2026-08-19T00:00:00Z"),
    returnDeliveryPromiseDate: new Date("2026-08-20T00:00:00Z"),
    pickedUpDate: new Date("2026-08-17T00:00:00Z"),
    shipmentType: "Forward",
    returnStatus: "completed",
    completionStatus: "Completed",
    returnType: "customer_return",
    returnReason: "DAMAGED_PRODUCT",
    returnSubReason: "Physical damage to product",
    comments: verbatimCustomerComment,
    vendorName: "Seller Direct Hub",
    locationName: "HYD Fulfillment Center",
    flyerStatus: null,
    flyerCaptured: null,
    flyerActual: null,
    deliveryProofTime: null,
    obdEligible: null,
    obdStatus: null,
    obdRemarks: null,
    deliveryProofOtc: null,
    bagTrackingId: null,
    orderType: "PREPAID",
    customerGstin: null,
    customerCompanyName: null,
    irnNumber: null,
    invoiceNumber: "INV-2026-001",
    invoiceDate: new Date("2026-07-02T00:00:00Z"),
  };

  const journey = buildOrderJourney("OD100200300400", {
    pnlReport: {
      fileName: "PnL_Jul2026.xlsx",
      fileSize: 100000,
      sheetNames: ["Overall Summary", "SKU-level P&L", "Orders P&L"],
      skuSheetName: "SKU-level P&L",
      ordersSheetName: "Orders P&L",
      skuLevel: [],
      orders: [pnlOrderRow as unknown as any],
      parsedAt: new Date().toISOString(),
    },
    returnsRecords: [returnReportRow as unknown as any],
  });

  if (!journey) {
    throw new Error("Failed to build order journey");
  }

  console.log("✓ Order Journey ID:", journey.orderId);
  console.log("✓ Items Count in Order:", journey.itemsCount);
  console.log("✓ Matched Return:", journey.hasReturn);
  console.log("✓ Primary Relationship Match:", journey.items[0].relationship);
  console.log("✓ Customer Verbatim Comment:", journey.items[0].returnRecord?.comments);

  if (!journey.items[0].relationship?.matched || journey.items[0].relationship?.source !== "order_item_id") {
    throw new Error("Expected primary relationship to match on order_item_id");
  }
  if (journey.items[0].returnRecord?.comments !== verbatimCustomerComment) {
    throw new Error("Customer comment was mutated or lost");
  }
  if (journey.items[0].financials.totalExpenses !== -115) {
    throw new Error(`Expected expenses to be -115, got ${journey.items[0].financials.totalExpenses}`);
  }

  // =========================================================================
  // TEST 5: No Fabricated Return Events when Returns Report is absent
  // =========================================================================
  console.log("\n▶ TEST 5: Verification of No Fabricated Events when Returns are Missing");
  const pnlOnlyJourney = buildOrderJourney("OD100200300400", {
    pnlReport: {
      fileName: "PnL_Jul2026.xlsx",
      fileSize: 100000,
      sheetNames: ["Overall Summary", "SKU-level P&L", "Orders P&L"],
      skuSheetName: "SKU-level P&L",
      ordersSheetName: "Orders P&L",
      skuLevel: [],
      orders: [pnlOrderRow as unknown as any],
      parsedAt: new Date().toISOString(),
    },
    returnsRecords: [], // NO Returns Report uploaded
  });

  if (!pnlOnlyJourney) {
    throw new Error("Failed to build pnl-only order journey");
  }

  const pnlItemTimeline = pnlOnlyJourney.items[0].timeline;
  const fabricatedReturnEvents = pnlItemTimeline.filter((e) => e.stage.startsWith("RETURN"));
  console.log(`✓ Timeline events without Returns report: ${pnlItemTimeline.length} events (Fabricated Return events: ${fabricatedReturnEvents.length})`);
  if (fabricatedReturnEvents.length > 0) {
    throw new Error("Fabricated return events detected when Returns report is not available");
  }
  if (!pnlOnlyJourney.diagnostics || pnlOnlyJourney.diagnostics.length === 0) {
    throw new Error("Expected missing source diagnostic when PnL indicates return without Returns report");
  }
  console.log("✓ Diagnostic surfaced:", pnlOnlyJourney.diagnostics[0].message);

  console.log("\n=================================================================");
  console.log("🎉 ALL INGESTION ENGINE RESILIENCE TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================================");
}

runResilienceTests();
