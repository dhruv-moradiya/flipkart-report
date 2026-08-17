import * as XLSX from "xlsx";
import { parseSkuPnlSheet, parseOrdersPnlSheet } from "./parsers/flipkart-pnl.parser";
import { buildPnlAnalytics } from "./reducers/pnl-analytics.reducer";
import { PnlReport } from "./types/pnl.types";

function runTest() {
  console.log("Starting Flipkart P&L Parser & Reducer Test...");

  // 1. Create Mock SKU-level P&L sheet data
  const skuSheetData = [
    {
      "SKU ID": "SILICONE-SINK-01",
      "Gross Units": 100,
      "Returned & Cancelled Units": 18,
      "Net Units": 82,
      "Estimated Net Sales": 24600,
      "Order Item Value": 25000,
      "Accounted Net Sales": 24600,
      "Total Expenses": 6150,
      "Rewards": 500,
      "Bank Settlement": 17000,
      "Input Tax Credits": 922,
      "Net Earnings": 18450,
      "Earnings per Unit": 225,
      "Amount Settled": 17000,
      "Amount Pending": 1450,
    },
    {
      "SKU ID": "BOTTLE-BRUSH-02",
      "Gross Units": 50,
      "Returned & Cancelled Units": 5,
      "Net Units": 45,
      "Estimated Net Sales": 9000,
      "Order Item Value": 9500,
      "Accounted Net Sales": 9000,
      "Total Expenses": 2700,
      "Rewards": 150,
      "Bank Settlement": 6000,
      "Input Tax Credits": 405,
      "Net Earnings": 6300,
      "Earnings per Unit": 140,
      "Amount Settled": 6000,
      "Amount Pending": 300,
    },
  ];

  // 2. Create Mock Orders P&L sheet data
  const ordersSheetData = [
    {
      "Order ID": "OD10001",
      "Order Item ID": "ITM10001",
      "SKU Name": "SILICONE-SINK-01",
      "Gross Units": 1,
      "Returned & Cancelled Units": 0,
      "Net Units": 1,
      "Order Item Value": 300,
      "Final Selling Price": 300,
      "Order Status": "Completed",
    },
    {
      "Order ID": "OD10002",
      "Order Item ID": "ITM10002",
      "SKU Name": "SILICONE-SINK-01",
      "Gross Units": 1,
      "Returned & Cancelled Units": 1,
      "Net Units": 0,
      "Order Item Value": 300,
      "Final Selling Price": 300,
      "Order Status": "Returned",
    },
    {
      "Order ID": "OD10003",
      "Order Item ID": "ITM10003",
      "SKU Name": "BOTTLE-BRUSH-02",
      "Gross Units": 2,
      "Returned & Cancelled Units": 0,
      "Net Units": 2,
      "Order Item Value": 400,
      "Final Selling Price": 400,
      "Order Status": "Completed",
    },
  ];

  const skuWs = XLSX.utils.json_to_sheet(skuSheetData);
  const ordersWs = XLSX.utils.json_to_sheet(ordersSheetData);

  const { records: skuRecords } = parseSkuPnlSheet(skuWs);
  const { records: orderRecords } = parseOrdersPnlSheet(ordersWs);

  console.log(`✓ Parsed ${skuRecords.length} SKU records.`);
  console.log(`✓ Parsed ${orderRecords.length} Order records.`);

  const mockReport: PnlReport = {
    fileName: "Flipkart_PnL_Mock.xlsx",
    fileSize: 10240,
    sheetNames: ["SKU-level P&L", "Orders P&L"],
    skuSheetName: "SKU-level P&L",
    ordersSheetName: "Orders P&L",
    skuLevel: skuRecords,
    orders: orderRecords,
    parsedAt: new Date().toISOString(),
  };

  const analytics = buildPnlAnalytics(mockReport);

  console.log("✓ Total Net Earnings:", analytics.overview.totalNetEarnings);
  console.log("✓ Total Gross Units:", analytics.overview.totalGrossUnits);
  console.log("✓ Overall Return Rate:", analytics.overview.overallReturnRate + "%");
  console.log("✓ Connected Orders for SKU 'SILICONE-SINK-01':", analytics.skus.allSkus[0].relatedOrdersCount);

  if (analytics.overview.totalNetEarnings !== 24750) {
    throw new Error(`Expected 24750 earnings, got ${analytics.overview.totalNetEarnings}`);
  }
  if (analytics.skus.allSkus[0].relatedOrdersCount !== 2) {
    throw new Error(`Expected 2 related orders for SILICONE-SINK-01, got ${analytics.skus.allSkus[0].relatedOrdersCount}`);
  }

  console.log("🎉 All P&L Reducer tests passed successfully!");
}

runTest();
