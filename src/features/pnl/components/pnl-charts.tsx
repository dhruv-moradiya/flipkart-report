"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Receipt,
  Layers,
  PieChart,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PnlAnalytics } from "../types/pnl-analytics.types";

interface PnlChartsProps {
  analytics: PnlAnalytics;
  onSelectSku?: (sku: string) => void;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function PnlCharts({ analytics, onSelectSku }: PnlChartsProps) {
  const { skus, overview, settlement } = analytics;
  const [rankingMode, setRankingMode] = useState<"earnings" | "sales" | "returns">("earnings");

  const topEarnings = skus.topByEarnings.slice(0, 6);
  const maxEarnings = Math.max(...topEarnings.map((s) => s.earnings), 1);

  const topSales = skus.topBySales.slice(0, 6);
  const maxSales = Math.max(...topSales.map((s) => s.sales), 1);

  const topReturns = skus.topByReturns.slice(0, 6);
  const maxReturns = Math.max(...topReturns.map((s) => s.returnedCancelledUnits), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top SKUs by Earnings / Sales / Returns */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-foreground" />
                Top Product Performance
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ranked by financial contribution
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={rankingMode === "earnings" ? "default" : "outline"}
                size="sm"
                onClick={() => setRankingMode("earnings")}
                className="h-6 px-2 text-[11px] cursor-pointer"
              >
                Earnings
              </Button>
              <Button
                variant={rankingMode === "sales" ? "default" : "outline"}
                size="sm"
                onClick={() => setRankingMode("sales")}
                className="h-6 px-2 text-[11px] cursor-pointer"
              >
                Sales
              </Button>
              <Button
                variant={rankingMode === "returns" ? "default" : "outline"}
                size="sm"
                onClick={() => setRankingMode("returns")}
                className="h-6 px-2 text-[11px] cursor-pointer"
              >
                Ret + Canc
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          {rankingMode === "earnings" &&
            topEarnings.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.earnings / maxEarnings) * 100));
              return (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku?.(item.sku)}
                  className="space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-foreground group-hover:underline truncate max-w-[220px]">
                      {item.sku}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {item.netUnits} units
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {formatINR(item.earnings)}
                      </span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-muted" />
                </div>
              );
            })}

          {rankingMode === "sales" &&
            topSales.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.sales / maxSales) * 100));
              return (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku?.(item.sku)}
                  className="space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-foreground group-hover:underline truncate max-w-[220px]">
                      {item.sku}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Exp: {formatINR(item.expenses)}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {formatINR(item.sales)}
                      </span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-muted" />
                </div>
              );
            })}

          {rankingMode === "returns" &&
            topReturns.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.returnedCancelledUnits / maxReturns) * 100));
              return (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku?.(item.sku)}
                  className="space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-foreground group-hover:underline truncate max-w-[220px]">
                      {item.sku}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono">
                        {item.returnRate}% rate
                      </Badge>
                      <span className="font-mono font-bold text-foreground">
                        {item.returnedCancelledUnits} units
                      </span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-muted" />
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* 2. Sales vs Expenses & Settlement Breakdown */}
      <div className="space-y-4">
        {/* Sales vs Expenses Financial Flow */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-foreground" />
              Sales & Expense Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Estimated Net Sales</span>
                <span className="font-mono font-bold text-foreground">{formatINR(overview.totalEstimatedNetSales)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Marketplace Expenses</span>
                <span className="font-mono font-bold text-foreground">
                  {formatINR(overview.totalExpenses)}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({overview.totalEstimatedNetSales > 0 ? ((overview.totalExpenses / overview.totalEstimatedNetSales) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-muted-foreground h-full rounded-full"
                  style={{
                    width: `${overview.totalEstimatedNetSales > 0 ? Math.min(100, (overview.totalExpenses / overview.totalEstimatedNetSales) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Net Seller Earnings</span>
                <span className="font-mono font-bold text-foreground">
                  {formatINR(overview.totalNetEarnings)}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({overview.totalEstimatedNetSales > 0 ? ((overview.totalNetEarnings / overview.totalEstimatedNetSales) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-foreground h-full rounded-full"
                  style={{
                    width: `${overview.totalEstimatedNetSales > 0 ? Math.max(0, Math.min(100, (overview.totalNetEarnings / overview.totalEstimatedNetSales) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Settled vs Amount Pending Comparison */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-foreground" />
                Payout Settlement Ratio
              </CardTitle>
              <span className="text-xs font-mono text-muted-foreground">
                Total: {formatINR(settlement.totalAmountSettled + settlement.totalAmountPending)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-foreground h-full transition-all"
                style={{ width: `${settlement.settledPercentage}%` }}
                title={`Settled: ${settlement.settledPercentage}%`}
              />
              <div
                className="bg-muted-foreground/40 h-full transition-all"
                style={{ width: `${settlement.pendingPercentage}%` }}
                title={`Pending: ${settlement.pendingPercentage}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                <span className="text-muted-foreground">Amount Settled:</span>
                <strong className="font-mono text-foreground">{formatINR(settlement.totalAmountSettled)}</strong>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {settlement.settledPercentage}%
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">Amount Pending:</span>
                <strong className="font-mono text-foreground">{formatINR(settlement.totalAmountPending)}</strong>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {settlement.pendingPercentage}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
