"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { GroupedBarDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";
import { formatINR } from "@/features/reports/excel/value-parser";

interface GroupedBarChartProps {
  data: GroupedBarDatum[];
  categories?: { key: string; color: string; label?: string }[];
  isCurrency?: boolean;
  height?: number;
}

export function GroupedBarChart({
  data,
  categories,
  isCurrency = false,
  height = 300,
}: GroupedBarChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No comparison data available." />;
  }

  // Derive series keys from first data item if not explicitly supplied
  const firstItem = data[0];
  const keys =
    categories ||
    Object.keys(firstItem)
      .filter((k) => k !== "category")
      .map((k, idx) => {
        const palette = [
          "var(--chart-1)",
          "var(--chart-2)",
          "var(--chart-5)",
          "var(--chart-3)",
          "var(--chart-4)",
        ];
        return {
          key: k,
          color: palette[idx % palette.length],
          label: k,
        };
      });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            interval={0}
            angle={data.length > 4 ? -20 : 0}
            textAnchor={data.length > 4 ? "end" : "middle"}
            tickFormatter={(val) => (val.length > 15 ? `${val.slice(0, 14)}…` : val)}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(val) => {
              if (isCurrency) {
                if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                return `₹${val}`;
              }
              return val;
            }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1.5 min-w-44">
                    <p className="font-bold text-foreground font-mono border-b border-border pb-1">
                      {label}
                    </p>
                    <div className="space-y-1">
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-3">
                          <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}:</span>
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {isCurrency ? formatINR(Number(entry.value)) : Number(entry.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }}
          />
          {keys.map((cat) => (
            <Bar
              key={cat.key}
              dataKey={cat.key}
              name={cat.label || cat.key}
              fill={cat.color}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
