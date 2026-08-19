import { ReportDateRange } from "../types/report.types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Pads number to 2 digits
 */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Returns string in YYYY-MM-DD format from Date
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * Formats YYYY-MM-DD into "DD MMM YYYY" (e.g. "01 Aug 2026")
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month >= 1 && month <= 12 && !isNaN(day) && !isNaN(year)) {
    const monthName = MONTH_SHORT[month - 1];
    return `${pad2(day)} ${monthName} ${year}`;
  }
  return dateStr;
}

/**
 * Calculates number of days between two YYYY-MM-DD dates inclusive
 */
export function getDateDifferenceInDays(startStr: string, endStr: string): number {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return 0;
  }
}

/**
 * Builds ReportDateRange object from start date and end date strings
 */
export function buildReportDateRange(
  startDateStr: string,
  endDateStr: string,
  customLabel?: string,
  source: string = "custom"
): ReportDateRange {
  const startParts = startDateStr.split("-").map((p) => parseInt(p, 10));
  const endParts = endDateStr.split("-").map((p) => parseInt(p, 10));

  const startYear = startParts[0] || new Date().getFullYear();
  const startMonth = startParts[1] || 1;
  const startDay = startParts[2] || 1;

  const endYear = endParts[0] || startYear;
  const endMonth = endParts[1] || startMonth;
  const endDay = endParts[2] || 31;

  const reportingPeriod = `${startYear}-${pad2(startMonth)}`;

  let periodLabel = customLabel;
  if (!periodLabel) {
    const lastDayOfMonth = new Date(startYear, startMonth, 0).getDate();
    if (startDay === 1 && endDay === lastDayOfMonth && startMonth === endMonth && startYear === endYear) {
      periodLabel = `${MONTH_NAMES[startMonth - 1]} ${startYear}`;
    } else {
      const sDisplay = formatDateDisplay(startDateStr);
      const eDisplay = formatDateDisplay(endDateStr);
      periodLabel = `${sDisplay} – ${eDisplay}`;
    }
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    periodLabel,
    reportingPeriod,
    selectedMonth: startMonth,
    selectedYear: startYear,
    source,
  };
}

/**
 * Returns full date range for a specific month and year
 */
export function getMonthDateRange(month: number, year: number): ReportDateRange {
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${pad2(month)}-01`;
  const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const reportingPeriod = `${year}-${pad2(month)}`;

  return {
    startDate,
    endDate,
    periodLabel,
    reportingPeriod,
    selectedMonth: month,
    selectedYear: year,
    source: "month_picker",
  };
}

/**
 * Generates preset date ranges
 */
export function getPresetDateRange(
  presetKey: "full_month" | "first_half" | "second_half" | "last_7_days" | "last_30_days" | "this_month",
  currentMonth: number = new Date().getMonth() + 1,
  currentYear: number = new Date().getFullYear()
): ReportDateRange {
  const now = new Date();

  switch (presetKey) {
    case "full_month": {
      return getMonthDateRange(currentMonth, currentYear);
    }
    case "first_half": {
      const startDate = `${currentYear}-${pad2(currentMonth)}-01`;
      const endDate = `${currentYear}-${pad2(currentMonth)}-15`;
      return buildReportDateRange(startDate, endDate, undefined, "first_half");
    }
    case "second_half": {
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const startDate = `${currentYear}-${pad2(currentMonth)}-16`;
      const endDate = `${currentYear}-${pad2(currentMonth)}-${pad2(lastDay)}`;
      return buildReportDateRange(startDate, endDate, undefined, "second_half");
    }
    case "last_7_days": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return buildReportDateRange(toISODateString(start), toISODateString(end), undefined, "last_7_days");
    }
    case "last_30_days": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return buildReportDateRange(toISODateString(start), toISODateString(end), undefined, "last_30_days");
    }
    case "this_month":
    default: {
      const thisMonth = now.getMonth() + 1;
      const thisYear = now.getFullYear();
      return getMonthDateRange(thisMonth, thisYear);
    }
  }
}

/**
 * Parses start and end dates from filename and metadata
 */
export function detectReportDateRange(
  fileName: string,
  ordersReceivedPeriod?: string
): { dateRange: ReportDateRange; detected: boolean; reason?: string } {
  // 1. Check ordersReceivedPeriod from Overall Summary metadata
  if (ordersReceivedPeriod && typeof ordersReceivedPeriod === "string") {
    // DD-MM-YYYY to DD-MM-YYYY
    const dmyMatch = ordersReceivedPeriod.match(
      /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s*(?:to|-|–|—)\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/i
    );
    if (dmyMatch) {
      const sDay = parseInt(dmyMatch[1], 10);
      const sMonth = parseInt(dmyMatch[2], 10);
      const sYear = parseInt(dmyMatch[3], 10);

      const eDay = parseInt(dmyMatch[4], 10);
      const eMonth = parseInt(dmyMatch[5], 10);
      const eYear = parseInt(dmyMatch[6], 10);

      if (sMonth >= 1 && sMonth <= 12 && sYear >= 2020 && eMonth >= 1 && eMonth <= 12 && eYear >= 2020) {
        const startStr = `${sYear}-${pad2(sMonth)}-${pad2(sDay)}`;
        const endStr = `${eYear}-${pad2(eMonth)}-${pad2(eDay)}`;
        return {
          dateRange: buildReportDateRange(startStr, endStr, undefined, "metadata"),
          detected: true,
          reason: `Detected from report metadata: ${ordersReceivedPeriod}`,
        };
      }
    }
  }

  const lowerName = fileName.toLowerCase();

  // 2. Check filename for text range like "Aug 1 2026 To Aug 13 2026" or "Aug 1 2026 - Aug 31 2026"
  const textRangeMatch = lowerName.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?[\s,]+(\d{4})\s*(?:to|-|–|—)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(\d{1,2})(?:st|nd|rd|th)?[\s,]+(\d{4})/i
  );
  if (textRangeMatch) {
    const startMonthIdx = MONTH_SHORT.findIndex((m) => m.toLowerCase() === textRangeMatch[1].toLowerCase().slice(0, 3));
    const startDay = parseInt(textRangeMatch[2], 10);
    const startYear = parseInt(textRangeMatch[3], 10);

    const endMonthName = textRangeMatch[4] ? textRangeMatch[4].toLowerCase().slice(0, 3) : textRangeMatch[1].toLowerCase().slice(0, 3);
    const endMonthIdx = MONTH_SHORT.findIndex((m) => m.toLowerCase() === endMonthName);
    const endDay = parseInt(textRangeMatch[5], 10);
    const endYear = parseInt(textRangeMatch[6], 10);

    if (startMonthIdx !== -1 && endMonthIdx !== -1) {
      const startStr = `${startYear}-${pad2(startMonthIdx + 1)}-${pad2(startDay)}`;
      const endStr = `${endYear}-${pad2(endMonthIdx + 1)}-${pad2(endDay)}`;
      return {
        dateRange: buildReportDateRange(startStr, endStr, undefined, "filename"),
        detected: true,
        reason: `Detected date range from filename (${formatDateDisplay(startStr)} to ${formatDateDisplay(endStr)})`,
      };
    }
  }

  // 3. Check filename for DD-MM-YYYY to DD-MM-YYYY
  const fileDmyMatch = lowerName.match(
    /(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})\s*(?:to|-|–|—|_to_)\s*(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})/i
  );
  if (fileDmyMatch) {
    const sDay = parseInt(fileDmyMatch[1], 10);
    const sMonth = parseInt(fileDmyMatch[2], 10);
    const sYear = parseInt(fileDmyMatch[3], 10);

    const eDay = parseInt(fileDmyMatch[4], 10);
    const eMonth = parseInt(fileDmyMatch[5], 10);
    const eYear = parseInt(fileDmyMatch[6], 10);

    if (sMonth >= 1 && sMonth <= 12 && sYear >= 2020 && eMonth >= 1 && eMonth <= 12 && eYear >= 2020) {
      const startStr = `${sYear}-${pad2(sMonth)}-${pad2(sDay)}`;
      const endStr = `${eYear}-${pad2(eMonth)}-${pad2(eDay)}`;
      return {
        dateRange: buildReportDateRange(startStr, endStr, undefined, "filename"),
        detected: true,
        reason: `Detected from filename date format (${formatDateDisplay(startStr)} to ${formatDateDisplay(endStr)})`,
      };
    }
  }

  // 4. Check filename for single month name + year (e.g. "Aug-2026", "July 2026", "pnl_2026-08")
  const yearMatch = lowerName.match(/\b(202[4-9]|203[0-5])\b/);
  const detectedYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

  const monthIndex = MONTH_NAMES.findIndex((m) =>
    lowerName.includes(m.toLowerCase()) || lowerName.includes(m.toLowerCase().slice(0, 3))
  );

  if (monthIndex !== -1) {
    const monthVal = monthIndex + 1;
    return {
      dateRange: getMonthDateRange(monthVal, detectedYear),
      detected: true,
      reason: `Detected monthly report period: ${MONTH_NAMES[monthIndex]} ${detectedYear}`,
    };
  }

  // Check "YYYY-MM" or "MM-YYYY"
  const ymMatch = lowerName.match(/\b(202[4-9])[-_](\d{1,2})\b/);
  if (ymMatch) {
    const y = parseInt(ymMatch[1], 10);
    const m = parseInt(ymMatch[2], 10);
    if (m >= 1 && m <= 12) {
      return {
        dateRange: getMonthDateRange(m, y),
        detected: true,
        reason: `Detected period: ${MONTH_NAMES[m - 1]} ${y}`,
      };
    }
  }

  // 5. Default fallback to current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return {
    dateRange: getMonthDateRange(currentMonth, currentYear),
    detected: false,
  };
}
