import { ReturnRecord } from "../types/return.types";
import { TimelineAnalytics, TimelineDataPoint } from "../types/analytics.types";
import { formatDate, formatISODateOnly, toValidDate } from "../utils/date";

/**
 * Calculates Timeline return request analytics
 *
 * Source Column: Return Requested Date
 */
export function calculateTimelineAnalytics(returns: ReturnRecord[]): TimelineAnalytics {
  const dateMap: Record<string, { timestamp: number; count: number; totalValue: number }> = {};

  let minTime = Infinity;
  let maxTime = -Infinity;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  returns.forEach((r) => {
    const d = toValidDate(r.returnRequestedDate);
    if (!d) return;

    const time = d.getTime();
    if (time < minTime) {
      minTime = time;
      minDate = d;
    }
    if (time > maxTime) {
      maxTime = time;
      maxDate = d;
    }

    const isoDate = formatISODateOnly(d);
    if (!dateMap[isoDate]) {
      dateMap[isoDate] = { timestamp: time, count: 0, totalValue: 0 };
    }
    dateMap[isoDate].count += 1;
    dateMap[isoDate].totalValue += r.totalPrice;
  });

  const daily: TimelineDataPoint[] = Object.entries(dateMap)
    .map(([isoDate, data]) => ({
      date: isoDate,
      timestamp: data.timestamp,
      count: data.count,
      totalValue: data.totalValue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build weekly aggregation
  const weeklyMap: Record<string, { timestamp: number; count: number; totalValue: number }> = {};
  daily.forEach((pt) => {
    const d = new Date(pt.date);
    // Find Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const weekKey = formatISODateOnly(monday);

    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = { timestamp: monday.getTime(), count: 0, totalValue: 0 };
    }
    weeklyMap[weekKey].count += pt.count;
    weeklyMap[weekKey].totalValue += pt.totalValue;
  });

  const weekly: TimelineDataPoint[] = Object.entries(weeklyMap)
    .map(([weekKey, data]) => ({
      date: weekKey,
      timestamp: data.timestamp,
      count: data.count,
      totalValue: data.totalValue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build monthly aggregation
  const monthlyMap: Record<string, { timestamp: number; count: number; totalValue: number }> = {};
  daily.forEach((pt) => {
    const monthKey = pt.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      const monthDate = new Date(pt.date);
      monthlyMap[monthKey] = { timestamp: monthDate.getTime(), count: 0, totalValue: 0 };
    }
    monthlyMap[monthKey].count += pt.count;
    monthlyMap[monthKey].totalValue += pt.totalValue;
  });

  const monthly: TimelineDataPoint[] = Object.entries(monthlyMap)
    .map(([monthKey, data]) => ({
      date: monthKey,
      timestamp: data.timestamp,
      count: data.count,
      totalValue: data.totalValue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    startDate: minDate ? formatDate(minDate) : null,
    endDate: maxDate ? formatDate(maxDate) : null,
    daily,
    weekly,
    monthly,
  };
}
