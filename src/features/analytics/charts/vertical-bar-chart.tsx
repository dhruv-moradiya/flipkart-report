"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { SimpleBarDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";

interface VerticalBarChartProps {
  data: SimpleBarDatum[];
  valueFormatter?: (val: number) => string;
  onItemClick?: (datum: SimpleBarDatum) => void;
  barColor?: string;
  height?: number;
}

export function VerticalBarChart({
  data,
  valueFormatter = (val) => val.toLocaleString(),
  onItemClick,
  barColor = "var(--chart-1)",
  height = 280,
}: VerticalBarChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No data available for this category." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            interval={0}
            angle={data.length > 5 ? -25 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
            tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 13)}…` : val)}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(val) => {
              if (Math.abs(val) >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
              if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
              return val;
            }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as SimpleBarDatum;
                return (
                  <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs space-y-1">
                    <p className="font-bold text-foreground font-mono">{item.label}</p>
                    <p className="text-muted-foreground">
                      Value:{" "}
                      <span className="font-mono font-bold text-foreground">
                        {item.formattedValue || valueFormatter(item.value)}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            onClick={(d) => onItemClick && onItemClick(d as unknown as SimpleBarDatum)}
            className={onItemClick ? "cursor-pointer" : ""}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.fill || barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
