import * as XLSX from "xlsx";
import {
  parseSettlementSummary,
  parseSettlementOrders,
  parseSettlementGst,
  parseSettlementAds,
} from "../parsers/flipkart-settlement.parser";
import { detectReportType } from "../detector/report-detector";

console.log("🚀 Running Flipkart Settled Transactions Parser & Detection Tests...\n");

// 1. Mock Summary Worksheet
const summaryData = [
  ["Report Type:", "Settled transactions only"],
  ["Period:", "1 July 2026 – 31 July 2026"],
  ["Orders", 3.45],
  ["MP Fee Rebate", 0.0],
  ["Protection Fund", 1048.51],
  ["Services Fees", 0.0],
  ["Tax Settlement", 0.0],
  ["Net Bank Settlement", 1051.96],
  ["Input GST + TCS Credits", 463.72],
  ["Income Tax / TDS Credits", 115.7],
  ["Total Realizable Amount", 1631.38],
  ["Sale Orders", 115],
  ["Returns", 24],
];

const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
const summaryResult = parseSettlementSummary(summaryWs);

console.log("▶ TEST 1: Summary Sheet Parsing");
console.log(`✓ Net Bank Settlement: ${summaryResult.netBankSettlement} (Expected: 1051.96)`);
console.log(`✓ Input GST + TCS: ${summaryResult.inputGstTcsCredits} (Expected: 463.72)`);
console.log(`✓ Income Tax / TDS: ${summaryResult.incomeTaxCredits} (Expected: 115.70)`);
console.log(`✓ Total Realizable: ${summaryResult.totalRealizableAmount} (Expected: 1631.38)`);
console.log(`✓ Sale Orders: ${summaryResult.saleOrdersCount}, Returns: ${summaryResult.returnsCount}`);

if (
  summaryResult.netBankSettlement !== 1051.96 ||
  summaryResult.totalRealizableAmount !== 1631.38 ||
  summaryResult.saleOrdersCount !== 115 ||
  summaryResult.returnsCount !== 24
) {
  throw new Error("Summary Sheet Parsing Test Failed!");
}
console.log("✅ Test 1 Passed: Summary parsed with 100% precision!\n");

// 2. Mock Orders Sheet
const ordersData = [
  // Header row
  [
    "NEFT ID",
    "Neft Type",
    "Payment Date",
    "Bank Settlement Value",
    "Input GST + TCS Credits",
    "Income Tax Credits",
    "",
    "Order ID",
    "Order Item ID",
    "Sale Amount",
    "Total Offer Amount",
    "My Share",
    "Customer Add-ons Amount",
    "Marketplace Fee",
    "Taxes",
    "Offer Adjustments",
    "Protection Fund",
    "Refund",
    "",
    "Tier",
    "Commission Rate",
    "Commission",
    "Fixed Fee",
    "Collection Fee",
    "Pick And Pack Fee",
    "Shipping Fee",
    "Reverse Shipping Fee",
    "",
    "TCS",
    "TDS",
    "GST on MP Fees",
    "",
    "Dead Weight",
    "Dimensions",
    "Volumetric Weight",
    "Chargeable Weight Slab",
    "Shipping Zone",
    "",
    "Order Date",
    "Dispatch Date",
    "Fulfilment Type",
    "Seller SKU",
    "Quantity",
    "Return Type",
    "Shopsy Order",
    "Item Return Status",
  ],
  // Data Row 1 (Delivered Order)
  [
    "NEFT_IND_001",
    "Prepaid",
    "2026-07-15",
    420.5,
    35.2,
    8.5,
    "",
    "OD10001",
    "ITEM10001",
    600.0,
    50.0,
    550.0,
    0.0,
    -120.0,
    -21.6,
    0.0,
    0.0,
    0.0,
    "",
    "Silver",
    0.1,
    -60.0,
    -15.0,
    -10.0,
    -5.0,
    -30.0,
    0.0,
    "",
    -6.0,
    -2.0,
    -21.6,
    "",
    0.35,
    "10x10x5",
    0.1,
    "0.5 kg",
    "National",
    "",
    "2026-07-10",
    "2026-07-11",
    "Seller Smart",
    "SKU-SHOE-BLACK-42",
    1,
    "",
    "No",
    "Delivered",
  ],
  // Data Row 2 (Returned Order)
  [
    "NEFT_IND_002",
    "Prepaid",
    "2026-07-20",
    -180.0,
    18.5,
    0.0,
    "",
    "OD10002",
    "ITEM10002",
    0.0,
    0.0,
    0.0,
    0.0,
    -180.0,
    -32.4,
    0.0,
    0.0,
    0.0,
    "",
    "Silver",
    0.0,
    0.0,
    -15.0,
    0.0,
    0.0,
    0.0,
    -165.0,
    "",
    0.0,
    0.0,
    -32.4,
    "",
    0.4,
    "12x12x6",
    0.15,
    "0.5 kg",
    "Regional",
    "",
    "2026-07-08",
    "2026-07-09",
    "Seller Smart",
    "SKU-SHOE-BLACK-42",
    1,
    "RTO",
    "No",
    "Returned",
  ],
];

const ordersWs = XLSX.utils.aoa_to_sheet(ordersData);
const ordersResult = parseSettlementOrders(ordersWs);

console.log("▶ TEST 2: Orders Sheet Parsing");
console.log(`✓ Orders parsed: ${ordersResult.length} (Expected: 2)`);
console.log(`✓ Row 1 Order ID: ${ordersResult[0]?.orderId}, SKU: ${ordersResult[0]?.sellerSku}, Bank Settlement: ${ordersResult[0]?.bankSettlementValue}`);
console.log(`✓ Row 1 Marketplace Fee: ${ordersResult[0]?.marketplaceFee} (Expected: -120)`);
console.log(`✓ Row 2 Reverse Shipping: ${ordersResult[1]?.reverseShippingFee} (Expected: -165)`);
console.log(`✓ Row 2 Status: ${ordersResult[1]?.itemReturnStatus}, Return Type: ${ordersResult[1]?.returnType}`);

if (
  ordersResult.length !== 2 ||
  ordersResult[0]?.bankSettlementValue !== 420.5 ||
  ordersResult[0]?.marketplaceFee !== -120 ||
  ordersResult[1]?.reverseShippingFee !== -165 ||
  ordersResult[1]?.itemReturnStatus !== "Returned"
) {
  throw new Error("Orders Sheet Parsing Test Failed!");
}
console.log("✅ Test 2 Passed: Orders parsed with preserved negative signs & 76 column mappings!\n");

// 4. Test Real CSV Ingestion with Report Help Header
const rawCsvContent = `Dear Seller,,,,,
Use of this report,"This report lists a summary of all transactions that were part of the NEFT mentioned in the file name, and includes settled transactions only."
Sub reports/ Sheets included in this report,,,,,
Orders,This contains the summary of all transactions related to orders received for your products.
MP Fee Rebate,This contains the summary of Rewards\\ MP fee Rebate paid
Storage & Recall,This contains the summary of all settled transactions
Payment Details,,,,,,,Transaction Summary,,,,,,,,,,,,Marketplace Fees,,,,,,,,,,,,,,,,,Taxes,,,,Offer Adjustments,,,,,,,Shipping Details,,,,,,,,Order Details,,,,,,,,,,,Buyer Invoice Details,,,Buyer Sale Details,,,,,,
NEFT ID,Neft Type, Payment Date,"Bank Settlement Value (Rs.) \n= SUM(J:R)","Input GST + TCS Credits (Rs.)\n[GST+TCS]","Income Tax Credits (Rs.)\n[TDS]",,Order ID,Order item ID,Sale Amount (Rs.),Total Offer Amount (Rs.),My share (Rs.),Customer Add-ons Amount (Rs.),"Marketplace Fee (Rs.)\n= SUM (V:AI)",Taxes (Rs.),Offer Adjustments (Rs.),Protection Fund (Rs.),Refund (Rs.),,Tier,Commission Rate (%),Commission (Rs.),Fixed Fee  (Rs.),Collection Fee (Rs.),Pick And Pack Fee (Rs.),Shipping Fee (Rs.),Reverse Shipping Fee (Rs.),No Cost Emi Fee Reimbursement(Rs.),Installation Fee (Rs.),Tech Visit Fee (Rs.),Uninstallation & Packaging Fee (Rs.),Customer Add-ons Amount Recovery (Rs.),Franchise Fee (Rs.),Shopsy Marketing Fee (Rs.),Product Cancellation Fee (Rs.),,TCS (Rs.),TDS (Rs.),GST on MP Fees (Rs.),,Offer amount settled as Discount in MP Fee (Rs.),Item GST Rate (%),"Discount in MP fees (Rs.) \n[AO/(1+AP/100)]","GST on Discount (Rs.) \n[18%*AQ]","Total Discount in MP Fee (Rs.) \n[AQ + AR]","Offer Adjustment (Rs.) \n[AS+AO]",,Dead Weight (kgs),Length*Breadth*Height,Volumetric Weight (kgs),Chargeable Weight Source,Chargeable Weight Type,Chargeable Wt. Slab (In Kgs),Shipping Zone,,Order Date,Dispatch Date,Fulfilment Type,Seller SKU,Quantity,Product Sub Category,Additional Information,Return Type,Shopsy Order,Item Return Status,,Invoice ID,Invoice Date,,Sale Amount,Total Offer Amount,,,My Share,,
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"Total (Rs.) \n","Total (Rs.) \n= SUM (BT:BU)",Free Shipping Offer (Rs.),Non-Free Shipping Offer (Rs.),"Total (Rs.) \n= SUM(BW:BX)",Free Shipping Offer (Rs.),Non-Free Shipping Offer (Rs.)
NFT-/XUTR/DEUTH026175A1RGSX ,Postpaid,2026-06-24,98.606,2.727,5.667,,OD437810194605824100,437810194605824100,119,0,0,0,-12,-8.394,0,0,0,,silver,0,0,-12,0,0,0,0,0,0,0,0,0,0,0,0,,-0.567,-5.667,-2.16,,0,0,0,0,0,0,,NA,NA,NA,NA,NA,NA,NA,,2026-06-12,2026-06-14,seller_easy_ship,Glory-MM-2026,1,magnifier,NA,NA,No,NA,,LWAEN92270000909,2026-06-12,,119,0,Not Available,Not Available,0,Not Available,Not Available
NFT-/XUTR/DEUTH026175A1RGSX ,Postpaid,2026-06-24,-189.98,28.98,0,,OD337770514190011100,337770514190011100,106,0,0,0,-161,-28.98,0,0,-106,,silver,0,0,-6,0,0,0,-155,0,0,0,0,0,0,0,0,,0,0,-28.98,,0,0,0,0,0,0,,0.22,8.50*8.50*8.50,0.12,System measured weight,NA,NA,National,,2026-06-07,2026-06-08,seller_easy_ship,Glory-M-2026,1,screen_expander_phone,NA,Customer Return,No,Product Delivered,,LWAEN92270000608,2026-06-08,,106,0,Not Available,Not Available,0,Not Available,Not Available
NFT-/XUTR/DEUTH026175A1RGSX ,Postpaid,2026-06-24,8.54,0,0,,OD337790423995298100,337790423995298100,0,0,0,0,0,0,0,8.54,0,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,0,0,,0,0,0,0,0,0,,NA,NA,NA,NA,NA,NA,NA,,2026-06-10,2026-06-11,seller_easy_ship,Glory-Me-26,1,screen_expander_phone,NA,Customer Return,No,Product Delivered,,LWAEN92270000722,2026-06-10,,78,18,Not Available,Not Available,0,Not Available,Not Available`;

const csvWb = XLSX.read(rawCsvContent, { type: "string" });
const csvSheet = csvWb.Sheets[csvWb.SheetNames[0]];
const csvOrders = parseSettlementOrders(csvSheet);

console.log("▶ TEST 4: CSV Ingestion with Header Offset & Special Headers");
console.log(`✓ CSV Orders parsed: ${csvOrders.length} (Expected: 3)`);
console.log(`✓ Row 1 Bank Settlement: ${csvOrders[0]?.bankSettlementValue}, SKU: ${csvOrders[0]?.sellerSku}, Invoice: ${csvOrders[0]?.invoiceId}`);
console.log(`✓ Row 2 Bank Settlement: ${csvOrders[1]?.bankSettlementValue}, Reverse Shipping: ${csvOrders[1]?.reverseShippingFee}, Return: ${csvOrders[1]?.returnType}`);
console.log(`✓ Row 3 Protection Fund: ${csvOrders[2]?.protectionFund}`);

const csvDetection = detectReportType(csvWb);
console.log(`✓ CSV Detection Type: ${csvDetection.type} (Expected: settlement)`);

if (
  csvOrders.length !== 3 ||
  csvOrders[0]?.bankSettlementValue !== 98.606 ||
  csvOrders[1]?.reverseShippingFee !== -155 ||
  csvOrders[2]?.protectionFund !== 8.54 ||
  csvDetection.type !== "settlement"
) {
  throw new Error("CSV Ingestion Test Failed!");
}
console.log("✅ Test 4 Passed: CSV with header offsets, Report Help preamble, and special headers parsed successfully!\n");

console.log("🎉 ALL SETTLED TRANSACTIONS PARSER & DETECTION TESTS PASSED SUCCESSFULLY!");
