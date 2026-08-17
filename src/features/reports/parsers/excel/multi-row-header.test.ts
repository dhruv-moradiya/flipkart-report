import * as XLSX from "xlsx";
import { parseSkuPnlSheet, parseOrdersPnlSheet } from "@/features/pnl/parsers/flipkart-pnl.parser";
import { parseMultiRowHeaderSheet } from "./multi-row-header";

function runMultiRowHeaderTest() {
  console.log("=== Running Multi-Row Header & Hidden Column Parser Regression Tests ===");

  // 1. Build a synthetic 2-Row Header Worksheet for SKU-level P&L
  // Row 1 (Index 0): Top headers with Merged ranges
  const row1 = [
    "SKU ID",                                   // A (0)
    null,                                       // B (1)
    "Gross Units (#)",                          // C (2)
    "Returned & Cancelled Units",               // D (3)
    "Returned & Cancelled Units (Breakup)",     // E (4) -> Merged E1:G1
    null,                                       // F (5)
    null,                                       // G (6)
    "Net Units (#)",                            // H (7)
    null,                                       // I (8)
    "Estimated Net Sales (INR)",                // J (9)
    "Sum of Order Item Value",                  // K (10)
    null,                                       // L (11)
    "Accounted Net Sales (Seller Price)",       // M (12)
    "Total Expenses (INR)",                     // N (13)
    "Total Expenses (Breakup)",                 // O (14) -> Merged O1:AH1
    null,                                       // P (15)
    null,                                       // Q (16)
    null,                                       // R (17)
    null,                                       // S (18)
    null,                                       // T (19)
    null,                                       // U (20)
    null,                                       // V (21)
    null,                                       // W (22)
    null,                                       // X (23)
    null,                                       // Y (24)
    null,                                       // Z (25)
    null,                                       // AA (26)
    null,                                       // AB (27)
    null,                                       // AC (28)
    null,                                       // AD (29)
    null,                                       // AE (30)
    null,                                       // AF (31)
    null,                                       // AG (32)
    null,                                       // AH (33)
    "Rewards & Other Benefits (INR)",           // AI (34)
    "Rewards & Other Benefits(Breakup)",        // AJ (35) -> Merged AJ1:AL1
    null,                                       // AK (36)
    null,                                       // AL (37)
    "Bank Settlement [Projected] (INR)",        // AM (38)
    "Input Tax Credits (INR)",                  // AN (39)
    "Input Tax Credits (Breakup)",              // AO (40) -> Merged AO1:AP1
    null,                                       // AP (41)
    "Net Earnings (INR)",                       // AQ (42)
    "Earnings per unit (INR)",                  // AR (43)
    null,                                       // AS (44)
    "Bank Settlement [Projected] (INR)",        // AT (45)
    "Amount Settled (INR)",                     // AU (46)
    "Amount Pending (INR)",                     // AV (47)
  ];

  // Row 2 (Index 1): Child headers
  const row2 = [
    "SKU ID",                                   // A (0)
    null,                                       // B (1)
    null,                                       // C (2)
    null,                                       // D (3)
    "RTO (Logistics Return)",                   // E (4)
    "RVP (Customer Return)",                    // F (5)
    "Cancellations",                            // G (6)
    null,                                       // H (7)
    null,                                       // I (8)
    null,                                       // J (9)
    null,                                       // K (10)
    null,                                       // L (11)
    null,                                       // M (12)
    null,                                       // N (13)
    "Commission Fee",                           // O (14)
    "Collection Fee",                           // P (15)
    "Fixed Fee",                                // Q (16)
    "Pick and Pack Fee",                        // R (17)
    "Forward Shipping Fee",                     // S (18)
    "Offer adjustments",                        // T (19)
    "Reverse Shipping Fee",                     // U (20)
    "Storage Fee",                              // V (21)
    "Recall Fee",                               // W (22)
    "No Cost Emi Fee Reimbursement(Rs.)",       // X (23)
    "Installation Fee (Rs.)",                   // Y (24)
    "Tech Visit Fee (Rs.)",                     // Z (25)
    "Uninstallation & Packaging Fee (Rs.)",     // AA (26)
    "Customer Add-ons Amount Recovery (Rs.)",   // AB (27)
    "Franchise Fee (Rs.)",                      // AC (28)
    "Shopsy Marketing Fee (Rs.)",               // AD (29)
    "Product Cancellation Fee (Rs.)",           // AE (30)
    "Taxes (GST)",                              // AF (31)
    "Taxes (TCS)",                              // AG (32)
    "Taxes (TDS)",                              // AH (33)
    null,                                       // AI (34)
    "Rewards",                                  // AJ (35)
    "Order SPF",                                // AK (36)
    "Non Order SPF",                            // AL (37)
    null,                                       // AM (38)
    null,                                       // AN (39)
    "GST + TCS",                                // AO (40)
    "TDS",                                      // AP (41)
    null,                                       // AQ (42)
    null,                                       // AR (43)
    null,                                       // AS (44)
    null,                                       // AT (45)
    null,                                       // AU (46)
    null,                                       // AV (47)
  ];

  // Row 3 (Index 2): Data Row with actual negative expenses from Flipkart
  const row3 = [
    "SKU-SHOE-BLACK-42",                        // A (0)
    null,                                       // B (1)
    10,                                         // C (2) - Gross Units
    2,                                          // D (3) - Ret+Canc
    1,                                          // E (4) - RTO
    1,                                          // F (5) - RVP
    0,                                          // G (6) - Cancellations
    8,                                          // H (7) - Net Units
    null,                                       // I (8)
    8000,                                       // J (9) - Est Net Sales
    10000,                                      // K (10) - Order Item Value
    null,                                       // L (11)
    8000,                                       // M (12) - Accounted Sales
    -2000,                                      // N (13) - Official Total Expenses
    -800,                                       // O (14) - Commission Fee (Negative)
    -160,                                       // P (15) - Collection Fee (Negative)
    -196,                                       // Q (16) - Fixed Fee (Negative)
    -100,                                       // R (17) - Pick and Pack Fee (Negative)
    -400,                                       // S (18) - Forward Shipping Fee (Negative)
    0,                                          // T (19) - Offer adjustments
    -220,                                       // U (20) - Reverse Shipping Fee (Negative)
    -50,                                        // V (21) - Storage Fee (Negative)
    -20,                                        // W (22) - Recall Fee (Negative)
    0,                                          // X (23)
    0,                                          // Y (24)
    0,                                          // Z (25)
    0,                                          // AA (26)
    0,                                          // AB (27)
    0,                                          // AC (28)
    0,                                          // AD (29)
    0,                                          // AE (30)
    -44,                                        // AF (31) - Taxes (GST)
    -8,                                         // AG (32) - Taxes (TCS)
    -2,                                         // AH (33) - Taxes (TDS)
    300,                                        // AI (34) - Total Benefits
    100,                                        // AJ (35) - Rewards
    200,                                        // AK (36) - Order SPF
    0,                                          // AL (37) - Non Order SPF
    6300,                                       // AM (38) - Bank Settlement Projected
    54,                                         // AN (39) - Total ITC
    52,                                         // AO (40) - GST + TCS
    2,                                          // AP (41) - TDS
    6354,                                       // AQ (42) - Net Earnings
    794.25,                                     // AR (43) - Earnings per unit
    null,                                       // AS (44)
    6300,                                       // AT (45)
    6000,                                       // AU (46) - Amount Settled
    300,                                        // AV (47) - Amount Pending
  ];

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3]);

  // Set SheetJS merges (E1:G1, O1:AH1, AJ1:AL1, AO1:AP1)
  ws["!merges"] = [
    { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },    // E1:G1
    { s: { r: 0, c: 14 }, e: { r: 0, c: 33 } },  // O1:AH1
    { s: { r: 0, c: 35 }, e: { r: 0, c: 37 } },  // AJ1:AL1
    { s: { r: 0, c: 40 }, e: { r: 0, c: 41 } },  // AO1:AP1
  ];

  // Set hidden columns in !cols (e.g. Columns O through AH are hidden / collapsed in Excel)
  const colsConfig: XLSX.ColInfo[] = [];
  for (let c = 0; c < 48; c++) {
    if (c >= 14 && c <= 33) {
      colsConfig[c] = { hidden: true };
    } else {
      colsConfig[c] = { hidden: false };
    }
  }
  ws["!cols"] = colsConfig;

  // 2. Test MultiRowHeaderMatrix extraction
  const matrix = parseMultiRowHeaderSheet(ws, 2);
  console.log(`✓ Detected ${matrix.columns.length} columns from matrix`);
  console.log(`✓ Detected ${matrix.dataRows.length} data rows`);

  // Verify Column Q (16) is Fixed Fee under Total Expenses (Breakup)
  const colQ = matrix.columns[16];
  console.log(`✓ Col Q (16): ${colQ.letter} -> Parent: "${colQ.parentHeader}", Child: "${colQ.childHeader}", Hidden: ${colQ.hidden}`);
  if (colQ.childHeader !== "Fixed Fee") {
    throw new Error(`Expected Col Q childHeader to be "Fixed Fee", got "${colQ.childHeader}"`);
  }
  if (colQ.parentHeader !== "Total Expenses (Breakup)") {
    throw new Error(`Expected Col Q parentHeader to be "Total Expenses (Breakup)", got "${colQ.parentHeader}"`);
  }

  // 3. Test parseSkuPnlSheet with 2-row headers and hidden columns
  const { records } = parseSkuPnlSheet(ws);
  if (records.length !== 1) {
    throw new Error(`Expected 1 record, got ${records.length}`);
  }

  const rec = records[0];
  console.log("✓ Parsed SKU:", rec.sku);
  console.log("✓ Fixed Fee (Negative):", rec.fixedFee, rec.expenses.fixedFee);
  console.log("✓ Reverse Shipping Fee (Negative):", rec.reverseShippingFee, rec.expenses.reverseShippingFee);
  console.log("✓ Commission Fee (Negative):", rec.commissionFee, rec.expenses.commissionFee);
  console.log("✓ Storage Fee (Negative):", rec.storageFee, rec.expenses.storageFee);
  console.log("✓ Recall Fee (Negative):", rec.recallFee, rec.expenses.recallFee);
  console.log("✓ GST Taxes (Negative):", rec.taxesGst, rec.expenses.gst);
  console.log("✓ TCS Taxes (Negative):", rec.taxesTcs, rec.expenses.tcs);
  console.log("✓ TDS Taxes (Negative):", rec.taxesTds, rec.expenses.tds);
  console.log("✓ Official Total Expenses:", rec.totalExpenses);

  // Assertions: MUST NOT BE ₹0!
  if (rec.fixedFee !== -196) {
    throw new Error(`Expected fixedFee to be -196, got ${rec.fixedFee}`);
  }
  if (rec.reverseShippingFee !== -220) {
    throw new Error(`Expected reverseShippingFee to be -220, got ${rec.reverseShippingFee}`);
  }
  if (rec.commissionFee !== -800) {
    throw new Error(`Expected commissionFee to be -800, got ${rec.commissionFee}`);
  }
  if (rec.taxesGst !== -44 || rec.expenses.gst !== -44) {
    throw new Error(`Expected taxesGst to be -44, got ${rec.taxesGst}`);
  }
  if (rec.taxesTcs !== -8 || rec.expenses.tcs !== -8) {
    throw new Error(`Expected taxesTcs to be -8, got ${rec.taxesTcs}`);
  }
  if (rec.taxesTds !== -2 || rec.expenses.tds !== -2) {
    throw new Error(`Expected taxesTds to be -2, got ${rec.taxesTds}`);
  }

  // Verify breakdown sum against totalExpenses
  const exp = rec.expenses;
  const breakdownSum =
    exp.commissionFee +
    exp.collectionFee +
    exp.fixedFee +
    exp.pickAndPackFee +
    exp.forwardShippingFee +
    exp.reverseShippingFee +
    exp.storageFee +
    exp.recallFee +
    exp.gst +
    exp.tcs +
    exp.tds;

  console.log(`✓ Expense Breakdown Sum: ${breakdownSum} vs Official Total Expenses: ${rec.totalExpenses}`);
  if (breakdownSum !== rec.totalExpenses) {
    throw new Error(`Breakdown sum ${breakdownSum} does not match totalExpenses ${rec.totalExpenses}`);
  }

  console.log("🎉 All Multi-Row Header & Hidden Column Regression Tests Passed Successfully!");
}

runMultiRowHeaderTest();
