import {
  detectReportDateRange,
  formatDateDisplay,
  getDateDifferenceInDays,
  getMonthDateRange,
  getPresetDateRange,
} from "../utils/date-range.utils";

function runDateRangeTests() {
  console.log("🚀 Running Date Range & Period Detection Tests...\n");

  // Test 1: Date Range from Filename (e.g. Aug 1 2026 To Aug 13 2026)
  const t1 = detectReportDateRange("Aug 1 2026 To Aug 13 2026.xlsx");
  if (t1.dateRange.startDate !== "2026-08-01" || t1.dateRange.endDate !== "2026-08-13") {
    throw new Error(`Test 1 Failed: Expected 2026-08-01 to 2026-08-13, got ${t1.dateRange.startDate} to ${t1.dateRange.endDate}`);
  }
  if (t1.dateRange.periodLabel !== "01 Aug 2026 – 13 Aug 2026") {
    throw new Error(`Test 1 Failed: Expected label '01 Aug 2026 – 13 Aug 2026', got '${t1.dateRange.periodLabel}'`);
  }
  console.log("✅ Test 1 Passed: Text range filename (Aug 1 2026 To Aug 13 2026) parsed correctly");

  // Test 2: Date Range from Metadata (01-08-2026 to 15-08-2026)
  const t2 = detectReportDateRange("some_random_report.xlsx", "01-08-2026 to 15-08-2026");
  if (t2.dateRange.startDate !== "2026-08-01" || t2.dateRange.endDate !== "2026-08-15") {
    throw new Error(`Test 2 Failed: Expected 2026-08-01 to 2026-08-15, got ${t2.dateRange.startDate} to ${t2.dateRange.endDate}`);
  }
  console.log("✅ Test 2 Passed: DD-MM-YYYY metadata range parsed correctly");

  // Test 3: Full Month Filename (e.g. August 2026)
  const t3 = detectReportDateRange("Profit-Loss-August-2026.xlsx");
  if (t3.dateRange.startDate !== "2026-08-01" || t3.dateRange.endDate !== "2026-08-31") {
    throw new Error(`Test 3 Failed: Expected full month August 2026, got ${t3.dateRange.startDate} to ${t3.dateRange.endDate}`);
  }
  if (t3.dateRange.periodLabel !== "August 2026") {
    throw new Error(`Test 3 Failed: Expected label 'August 2026', got '${t3.dateRange.periodLabel}'`);
  }
  console.log("✅ Test 3 Passed: Full month detection handled correctly");

  // Test 4: Duration calculation
  const days = getDateDifferenceInDays("2026-08-01", "2026-08-13");
  if (days !== 13) {
    throw new Error(`Test 4 Failed: Expected 13 days, got ${days}`);
  }
  console.log("✅ Test 4 Passed: Duration calculation (13 days) verified");

  // Test 5: Date Display formatting
  const formatted = formatDateDisplay("2026-08-05");
  if (formatted !== "05 Aug 2026") {
    throw new Error(`Test 5 Failed: Expected '05 Aug 2026', got '${formatted}'`);
  }
  console.log("✅ Test 5 Passed: Date formatting verified");

  // Test 6: Presets
  const firstHalf = getPresetDateRange("first_half", 8, 2026);
  if (firstHalf.startDate !== "2026-08-01" || firstHalf.endDate !== "2026-08-15") {
    throw new Error(`Test 6 Failed: Expected 2026-08-01 to 2026-08-15 for first_half`);
  }
  const secondHalf = getPresetDateRange("second_half", 8, 2026);
  if (secondHalf.startDate !== "2026-08-16" || secondHalf.endDate !== "2026-08-31") {
    throw new Error(`Test 6 Failed: Expected 2026-08-16 to 2026-08-31 for second_half`);
  }
  console.log("✅ Test 6 Passed: Presets (1st-15th & 16th-31st) verified");

  console.log("\n🎉 All Date Range tests passed successfully!");
}

runDateRangeTests();
