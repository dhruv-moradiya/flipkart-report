"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  IndianRupee,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShoppingBag,
  FileSpreadsheet,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PnlAnalytics } from "../types/pnl-analytics.types";

interface PnlDashboardOverviewProps {
  analytics: PnlAnalytics;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function PnlDashboardOverview({ analytics }: PnlDashboardOverviewProps) {
  const { overview, earnings, settlement, orders, rawReport } = analytics;

  const isProfitable = overview.totalNetEarnings >= 0;

  return (
    <div className="space-y-4">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Net Earnings */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Net Earnings
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {formatINR(overview.totalNetEarnings)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Avg. ₹{overview.averageEarningsPerUnit} / net unit</span>
                <span>•</span>
                <span className="font-medium text-foreground">{earnings.profitableSkusCount} profitable SKUs</span>
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border shrink-0 ${isProfitable ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive"}`}>
              {isProfitable ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </CardContent>
        </Card>

        {/* 2. Estimated Net Sales */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estimated Net Sales
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {formatINR(overview.totalEstimatedNetSales)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Accounted: {formatINR(overview.totalAccountedNetSales)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Total Expenses & Rewards */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Expenses
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {formatINR(overview.totalExpenses)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rewards: {formatINR(overview.totalRewards)} • ITC: {formatINR(overview.totalInputTaxCredits)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Units & Returns + Cancellations */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Units Performance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {overview.totalNetUnits.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">Net</span>
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {overview.totalGrossUnits.toLocaleString()} Gross
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono">
                  {overview.totalReturnedCancelledUnits} Ret + Canc ({overview.overallReturnRate}%)
                </Badge>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics: Settlements & Orders Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Amount Settled */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Amount Settled
              </span>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatINR(settlement.totalAmountSettled)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {settlement.settledPercentage}% of total payout
              </span>
            </div>
            <CheckCircle2 className="h-4 w-4 text-foreground/70" />
          </CardContent>
        </Card>

        {/* Amount Pending */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Amount Pending
              </span>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatINR(settlement.totalAmountPending)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {settlement.pendingPercentage}% pending settlement
              </span>
            </div>
            <Clock className="h-4 w-4 text-foreground/70" />
          </CardContent>
        </Card>

        {/* Total Active SKUs */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                SKUs Analyzed
              </span>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {overview.totalSkus.toLocaleString()}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {earnings.lossMakingSkusCount > 0 ? `${earnings.lossMakingSkusCount} loss-making` : "100% profitable"}
              </span>
            </div>
            <Layers className="h-4 w-4 text-foreground/70" />
          </CardContent>
        </Card>

        {/* Orders Volume */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Orders & Items
              </span>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {orders.totalOrders.toLocaleString()} Orders
              </p>
              <span className="text-[10px] text-muted-foreground">
                {orders.totalOrderItems.toLocaleString()} order items tracked
              </span>
            </div>
            <ShoppingBag className="h-4 w-4 text-foreground/70" />
          </CardContent>
        </Card>
      </div>

      {/* Official Data Source Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-foreground" />
            <span>Data Source:</span>
            <strong className="text-foreground">Flipkart — SKU-level P&L + Orders P&L</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Uploaded File:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {rawReport.fileName}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {rawReport.skuSheetName} ({overview.totalSkus} SKUs)
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {rawReport.ordersSheetName} ({orders.totalOrderItems} items)
            </Badge>
          </div>
        </div>

        <div className="text-[11px]">
          Official Flipkart P&L settlement & earnings calculations applied
        </div>
      </div>
    </div>
  );
}
