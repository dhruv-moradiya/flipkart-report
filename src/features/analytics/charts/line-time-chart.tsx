"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TimeSeriesDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";
import { formatINR } from "@/features/reports/excel/value-parser";

interface LineTimeChartProps {
  data: TimeSeriesDatum[];
  isCurrency?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}

export function LineTimeChart({
  data,
  isCurrency = false,
  primaryLabel = "Returns Requested",
  secondaryLabel = "Returns Completed",
  height = 280,
}: LineTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <ChartEmptyState
        message="Date-level trend data is not available in the uploaded report."
        hint="Trend analysis requires date records in the report."
      />
    );
  }

  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            interval="preserveStartEnd"
            angle={data.length > 5 ? -25 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
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
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1.5 min-w-40">
                    <p className="font-bold text-foreground font-mono border-b border-border pb-1">
                      {label}
                    </p>
                    {payload.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
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
                );
              }
              return null;
            }}
          />
          {hasSecondary && (
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name={primaryLabel}
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--chart-1)" }}
            activeDot={{ r: 5 }}
          />
          {hasSecondary && (
            <Line
              type="monotone"
              dataKey="secondaryValue"
              name={secondaryLabel}
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--chart-2)" }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
