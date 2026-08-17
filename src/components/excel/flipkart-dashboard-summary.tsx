"use client";

import React, { useMemo } from "react";
import {
  Package,
  IndianRupee,
  Truck,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ParsedSheet } from "@/types/excel";
import { calculateFlipkartReturnMetrics } from "@/lib/excel-utils";

interface FlipkartDashboardSummaryProps {
  sheet: ParsedSheet;
}

export function FlipkartDashboardSummary({ sheet }: FlipkartDashboardSummaryProps) {
  const metrics = useMemo(() => calculateFlipkartReturnMetrics(sheet), [sheet]);

  const formattedRefundValue = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(metrics.totalRefundValue);
  }, [metrics.totalRefundValue]);

  return (
    <div className="space-y-4">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Returns */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Returns
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {metrics.totalReturns.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">orders</span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
                Parsed Flipkart Report
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Return Amount */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Return Value
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {formattedRefundValue}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3 text-muted-foreground" />
                Est. Total Amount
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Courier Returns (RTO) */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Courier Returns (RTO)
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {metrics.courierReturns.toLocaleString()}
                </span>
                {metrics.totalReturns > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({((metrics.courierReturns / metrics.totalReturns) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3 text-muted-foreground" />
                Undelivered Dispatches
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Customer Returns */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Customer Returns
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {metrics.customerReturns.toLocaleString()}
                </span>
                {metrics.totalReturns > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({((metrics.customerReturns / metrics.totalReturns) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
                Post-Delivery Returns
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
