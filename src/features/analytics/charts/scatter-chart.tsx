"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { ScatterPointDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";
import { formatINR } from "@/features/reports/excel/value-parser";

interface CrossReportScatterChartProps {
  data: ScatterPointDatum[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  isXCurrency?: boolean;
  isYPercent?: boolean;
  onPointClick?: (point: ScatterPointDatum) => void;
  height?: number;
}

export function CrossReportScatterChart({
  data,
  xAxisLabel = "Sales (INR)",
  yAxisLabel = "Return Rate (%)",
  isXCurrency = true,
  isYPercent = true,
  onPointClick,
  height = 320,
}: CrossReportScatterChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No correlation data available for this analysis." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(val) => {
              if (isXCurrency) {
                if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                return `₹${val}`;
              }
              return val;
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(val) => (isYPercent ? `${val}%` : val)}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pt = payload[0].payload as ScatterPointDatum;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1 min-w-44">
                    <p className="font-bold text-foreground font-mono border-b border-border pb-1">
                      {pt.name}
                    </p>
                    <p className="text-muted-foreground">
                      {xAxisLabel}:{" "}
                      <span className="font-mono font-bold text-foreground">
                        {pt.formattedX || (isXCurrency ? formatINR(pt.x) : pt.x)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {yAxisLabel}:{" "}
                      <span className="font-mono font-bold text-foreground">
                        {pt.formattedY || (isYPercent ? `${pt.y}%` : pt.y)}
                      </span>
                    </p>
                    {pt.z !== undefined && (
                      <p className="text-[10px] text-muted-foreground">Units: {pt.z}</p>
                    )}
                    {onPointClick && (
                      <p className="text-[10px] text-primary pt-0.5 font-medium">Click to inspect</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="SKUs"
            data={data}
            fill="var(--chart-1)"
            onClick={(pt) => onPointClick && onPointClick(pt as unknown as ScatterPointDatum)}
            className={onPointClick ? "cursor-pointer" : ""}
          >
            {data.map((_, idx) => (
              <Cell key={`scatter-cell-${idx}`} fill="var(--chart-1)" stroke="var(--card)" strokeWidth={1} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
