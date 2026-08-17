import { ReturnRecord } from "@/features/reports/models/returns.models";
import { SimpleBarDatum, PieChartDatum, TimeSeriesDatum, TopNCount } from "../types/analytics.types";
import { formatDate } from "@/features/reports/excel/date-parser";

/**
 * Return Status Distribution (From Returns Report)
 */
export function getReturnStatusDistribution(returns: ReturnRecord[]): SimpleBarDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  returns.forEach((r) => {
    const status = r.returnStatus?.trim() || r.completionStatus?.trim() || "Unknown";
    map.set(status, (map.get(status) || 0) + 1);
  });

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} returns`,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Top Return Reasons
 */
export function getTopReturnReasons(returns: ReturnRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  returns.forEach((r) => {
    const reason = r.returnReason?.trim() || "Unspecified Reason";
    map.set(reason, (map.get(reason) || 0) + 1);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value]) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} items`,
      fill: "var(--chart-5)",
    }));
}

/**
 * Top Return Sub-reasons (Granular Defects & Dissatisfaction)
 */
export function getTopReturnSubReasons(returns: ReturnRecord[], topN: TopNCount = 10): SimpleBarDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  returns.forEach((r) => {
    if (r.returnSubReason && r.returnSubReason.trim()) {
      const sub = r.returnSubReason.trim();
      map.set(sub, (map.get(sub) || 0) + 1);
    }
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value]) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} items`,
      fill: "var(--chart-3)",
    }));
}

/**
 * Return Type Composition (Customer Return RVP vs Courier Return RTO)
 */
export function getReturnTypeDistribution(returns: ReturnRecord[]): PieChartDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  returns.forEach((r) => {
    const type =
      r.returnType?.toLowerCase().includes("courier") || r.returnType?.toLowerCase().includes("rto")
        ? "Courier Return (RTO)"
        : "Customer Return (RVP)";
    map.set(type, (map.get(type) || 0) + 1);
    total++;
  });

  const palette = ["var(--chart-5)", "var(--chart-2)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Final Product Condition Distribution
 */
export function getReturnConditionDistribution(returns: ReturnRecord[]): SimpleBarDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  returns.forEach((r) => {
    if (r.finalCondition && r.finalCondition.trim()) {
      const cond = r.finalCondition.trim();
      map.set(cond, (map.get(cond) || 0) + 1);
    }
  });

  if (map.size === 0) return [];

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      formattedValue: `${value.toLocaleString()} items`,
      fill: palette[idx % palette.length],
    }));
}

/**
 * Return Completion SLA Breach Distribution
 */
export function getReturnBreachDistribution(returns: ReturnRecord[]): PieChartDatum[] {
  if (!returns || returns.length === 0) return [];

  const map = new Map<string, number>();
  let total = 0;

  returns.forEach((r) => {
    const breach =
      r.returnCompletionBreach && r.returnCompletionBreach.toLowerCase().includes("yes")
        ? "SLA Breached"
        : "Within SLA";
    map.set(breach, (map.get(breach) || 0) + 1);
    total++;
  });

  const palette = ["var(--chart-1)", "var(--chart-5)"];

  return Array.from(map.entries()).map(([name, value], idx) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
    fill: palette[idx % palette.length],
  }));
}

/**
 * Returns Timeline Activity by Date
 */
export function getReturnTimelineSeries(returns: ReturnRecord[]): TimeSeriesDatum[] {
  if (!returns || returns.length === 0) return [];

  const dateMap = new Map<string, { requested: number; completed: number }>();

  returns.forEach((r) => {
    if (r.returnRequestedDate) {
      const d = formatDate(r.returnRequestedDate);
      if (d && d !== "—") {
        const cur = dateMap.get(d) || { requested: 0, completed: 0 };
        cur.requested++;
        dateMap.set(d, cur);
      }
    }
    if (r.completedDate) {
      const d = formatDate(r.completedDate);
      if (d && d !== "—") {
        const cur = dateMap.get(d) || { requested: 0, completed: 0 };
        cur.completed++;
        dateMap.set(d, cur);
      }
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, counts]) => ({
      date,
      value: counts.requested,
      secondaryValue: counts.completed,
      label: `${date}: ${counts.requested} requested, ${counts.completed} completed`,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
