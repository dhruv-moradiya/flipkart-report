import * as XLSX from "xlsx";
import { parseSkuPnlSheet, parseOrdersPnlSheet } from "@/features/pnl/parsers/flipkart-pnl.parser";
import { detectReportType } from "@/features/reports/utils/report-detector";
import { buildOrderJourney } from "./order-journey.builder";
import { PnlReport } from "@/features/pnl/types/pnl.types";
import { ReturnRecord } from "@/features/returns/types/return.types";

function runTest() {
  console.log("Starting Dual-Report Detection & Order Journey Relationship Test...");

  // 1. Mock Overall Summary Sheet
  const summarySheetData = [
    ["Report Type:", "Profit & Loss Report"],
    ["Orders Received During:", "2026-07-01 to 2026-07-31"],
    ["Generated on:", "2026-08-17"],
    ["Seller ID:", "MKT_SELLER_992"],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summarySheetData);

  // 2. Mock SKU-level P&L Sheet (49 cols)
  const skuSheetData = [
    {
      "SKU ID": "Glory-J-2026",
      "Gross Units (#)": 100,
      "Returned & Cancelled Units": 15,
      "RTO (Logistics Return)": 5,
      "RVP (Customer Return)": 8,
      "Cancellations": 2,
      "Net Units (#)": 85,
      "Estimated Net Sales (INR)": 25500,
      "Sum of Order Item Value": 27000,
      "Accounted Net Sales (Seller Price)": 25500,
      "Total Expenses (INR)": 5100,
      "Commission Fee": 2550,
      "Collection Fee": 510,
      "Fixed Fee": 1000,
      "Pick and Pack Fee": 500,
      "Forward Shipping Fee": 540,
      "Rewards & Other Benefits (INR)": 400,
      "Bank Settlement [Projected] (INR)": 20800,
      "Input Tax Credits (INR)": 918,
      "Net Earnings (INR)": 21718,
      "Earnings per unit (INR)": 255.5,
      "Amount Settled (INR)": 19000,
      "Amount Pending (INR)": 1800,
    },
  ];
  const skuWs = XLSX.utils.json_to_sheet(skuSheetData);

  // 3. Mock Orders P&L Sheet (90 cols + Transactions)
  const ordersSheetData = [
    {
      "Order Date": "2026-07-02",
      "Order ID": "OD437984078071448100",
      "Order Item ID": "437984078071448101",
      "SKU Name": "Glory-J-2026",
      "Fulfillment Type": "Flipkart Assured",
      "Channel of Sale": "Flipkart",
      "Mode of Payment": "Prepaid UPI",
      "Order Status": "Completed",
      "Gross Units": 1,
      "Returned & Cancelled Units": 1,
      "RVP (Customer Return)": 1,
      "Net Units": 0,
      "Order Item Value": 367,
      "Final Selling Price (FSP)": 272,
      "Handling Fee": 0,
      "Estimated Net Sales (INR)": 272,
      "Accounted Net Sales (Seller Price)": 272,
      "Gross Sale Value": 367,
      "Seller-Funded Discount": 95,
      "Total Expenses (INR)": 68,
      "Commission Fee": 34,
      "Fixed Fee": 15,
      "Collection Fee": 6,
      "Forward Shipping Fee": 13,
      "Bank Settlement [Projected]": 204,
      "Input Tax Credits": 12,
      "Net Earnings": 216,
      "Amount Settled": 204,
      "Amount Pending": 0,
      "Transaction-1: Transaction Amount": 204,
      "Transaction-1: Reason": "Order Settlement",
      "Transaction-1: Current Status": "Settled",
      "Transaction-1: Payment Date": "2026-07-10",
      "Transaction-1: NEFT ID": "NEFT123456789",
    },
  ];
  const ordersWs = XLSX.utils.json_to_sheet(ordersSheetData);

  // 4. Test Report Detector
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summaryWs, "Overall Summary");
  XLSX.utils.book_append_sheet(wb, skuWs, "SKU-level P&L");
  XLSX.utils.book_append_sheet(wb, ordersWs, "Orders P&L");

  const detection = detectReportType(wb);
  console.log("✓ Detected Report Type:", detection.detectedType);
  console.log("✓ Orders Period:", detection.overallSummary?.ordersReceivedPeriod);

  if (detection.detectedType !== "profit_loss") {
    throw new Error(`Expected profit_loss detection, got ${detection.detectedType}`);
  }

  // 5. Parse SKU and Orders
  const { records: skuRecords } = parseSkuPnlSheet(skuWs);
  const { records: orderRecords } = parseOrdersPnlSheet(ordersWs);

  const mockPnlReport: PnlReport = {
    fileName: "Flipkart_PnL_July_2026.xlsx",
    fileSize: 20480,
    sheetNames: ["Overall Summary", "SKU-level P&L", "Orders P&L"],
    skuSheetName: "SKU-level P&L",
    ordersSheetName: "Orders P&L",
    skuLevel: skuRecords,
    orders: orderRecords,
    parsedAt: new Date().toISOString(),
  };

  // 6. Mock Corresponding Flipkart Returns Record
  const mockReturnsRecords: ReturnRecord[] = [
    {
      locationId: "LOC_BLR_01",
      orderId: "OD437984078071448100",
      orderItemId: "437984078071448101",
      returnId: "RET_99881122",
      trackingId: "FMPR0949350764",
      shipmentId: "SHP_8811",
      replacementOrderItemId: null,
      sku: "Glory-J-2026",
      fsn: "FSN_GLORY_123",
      product: "Glory Ultra Clean Silicone Sinks",
      totalPrice: 272,
      quantity: 1,
      ffType: "FA",
      returnRequestedDate: new Date("2026-08-16"),
      returnApprovalDate: new Date("2026-08-16"),
      completedDate: new Date("2026-08-20"),
      outForDeliveryDate: new Date("2026-08-19"),
      returnDeliveryPromiseDate: new Date("2026-08-20"),
      pickedUpDate: new Date("2026-08-17"),
      shipmentType: "Forward",
      returnStatus: "in_transit",
      completionStatus: "Completed",
      returnType: "customer_return",
      returnReason: "Quality Issue",
      returnSubReason: "Defective item received",
      comments: "Customer stated the silicone frame arrived bent.",
      vendorName: "Seller Vendor",
      locationName: "BLR Warehouse",
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
      invoiceNumber: "INV-100",
      invoiceDate: new Date("2026-07-02"),
    },
  ];

  // 7. Test Order Journey Builder Joining P&L and Returns via Order Item ID
  const journey = buildOrderJourney("OD437984078071448100", {
    pnlReport: mockPnlReport,
    returnsRecords: mockReturnsRecords,
  });

  if (!journey) {
    throw new Error("Failed to build Order Journey for OD437984078071448100");
  }

  console.log("✓ Order Journey ID:", journey.orderId);
  console.log("✓ Items Count:", journey.items.length);
  console.log("✓ Has Return Connected:", journey.hasReturn);
  console.log("✓ Net Earnings:", journey.totalNetEarnings);
  console.log("✓ Return Reason from Returns Report:", journey.items[0].returnRecord?.returnReason);
  console.log("✓ Customer Comments from Returns Report:", journey.items[0].returnRecord?.comments);
  console.log("✓ Settlement Txn Amount:", journey.items[0].transactions[0]?.transactionAmount);
  console.log("✓ Timeline Events Count:", journey.items[0].timeline.length);

  if (!journey.hasReturn) {
    throw new Error("Expected hasReturn to be true");
  }
  if (journey.items[0].returnRecord?.returnId !== "RET_99881122") {
    throw new Error("Expected returnId RET_99881122");
  }
  if (journey.items[0].transactions[0]?.neftId !== "NEFT123456789") {
    throw new Error("Expected NEFT ID NEFT123456789");
  }

  console.log("🎉 Complete Dual-Report & Order Journey test passed successfully!");
}

runTest();
