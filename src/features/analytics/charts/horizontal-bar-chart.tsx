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
} from "recharts";
import { SimpleBarDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";

interface HorizontalBarChartProps {
  data: SimpleBarDatum[];
  valueFormatter?: (val: number) => string;
  onItemClick?: (datum: SimpleBarDatum) => void;
  barColor?: string;
  height?: number;
  layout?: "layout-fixed" | "layout-dynamic";
}

export function HorizontalBarChart({
  data,
  valueFormatter = (val) => val.toLocaleString(),
  onItemClick,
  barColor = "var(--chart-1)",
  height,
}: HorizontalBarChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No data available for the selected criteria." />;
  }

  const dynamicHeight = height || Math.max(260, data.length * 34);

  return (
    <div className="w-full" style={{ height: dynamicHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(val) => {
              if (Math.abs(val) >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
              if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
              return val;
            }}
          />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 500 }}
            width={120}
            tickFormatter={(val) => (val.length > 16 ? `${val.slice(0, 15)}…` : val)}
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
                    {item.secondaryValue !== undefined && (
                      <p className="text-[10px] text-muted-foreground">
                        Signed: {item.secondaryValue}
                      </p>
                    )}
                    {onItemClick && (
                      <p className="text-[10px] text-primary pt-0.5 font-medium">Click to inspect</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
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
