"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { PieChartDatum } from "../types/analytics.types";
import { ChartEmptyState } from "../components/chart-empty-state";
import { formatINR } from "@/features/reports/excel/value-parser";

interface PieDonutChartProps {
  data: PieChartDatum[];
  isCurrency?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
}

export function PieDonutChart({
  data,
  isCurrency = false,
  innerRadius = 55,
  outerRadius = 85,
  height = 280,
}: PieDonutChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No composition data available." />;
  }

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="w-full flex items-center justify-center" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as PieChartDatum;
                return (
                  <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs space-y-1">
                    <p className="font-bold text-foreground font-mono">{item.name}</p>
                    <p className="text-muted-foreground">
                      Value:{" "}
                      <span className="font-mono font-bold text-foreground">
                        {isCurrency ? formatINR(item.value) : item.value.toLocaleString()}
                      </span>
                    </p>
                    {item.percentage !== undefined && (
                      <p className="text-[11px] text-muted-foreground">
                        Share: {item.percentage.toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={entry.fill || palette[idx % palette.length]}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
