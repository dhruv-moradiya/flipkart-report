"use client";

import React from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getOverviewMetrics,
  getOverviewFinancialComparison,
  getOverviewUnitsComparison,
  getOrdersStatusDistribution,
  getFulfillmentDistribution,
} from "../calculations/overview";
import { ChartCardContainer } from "../charts/chart-container";
import { GroupedBarChart } from "../charts/grouped-bar-chart";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { PieDonutChart } from "../charts/pie-donut-chart";
import { formatINR } from "@/features/reports/excel/value-parser";

export function OverviewView() {
  const { pnlReport, records } = useExcelData();
  const metrics = getOverviewMetrics(pnlReport, records);
  const finComparison = getOverviewFinancialComparison(pnlReport);
  const unitsComparison = getOverviewUnitsComparison(pnlReport, records);
  const orderStatuses = getOrdersStatusDistribution(pnlReport);
  const fulfillments = getFulfillmentDistribution(pnlReport);

  return (
    <div className="space-y-6">
      {/* 1. Top Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Accounted Sales</span>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(metrics.accountedNetSales)}</p>
          <span className="text-[10px] text-muted-foreground">{metrics.totalOrders.toLocaleString()} orders</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Expenses</span>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(metrics.totalExpenses)}</p>
          <span className="text-[10px] text-muted-foreground">Marketplace fees</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Earnings</span>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(metrics.netEarnings)}</p>
          <span className="text-[10px] text-muted-foreground">Official Flipkart P&L</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Gross Ordered</span>
          <p className="text-base font-bold font-mono text-foreground">{metrics.grossUnits.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground">Total units</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Ret + Cancelled</span>
          <p className="text-base font-bold font-mono text-foreground">{metrics.returnedCancelledUnits.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground">
            {metrics.grossUnits > 0 ? ((metrics.returnedCancelledUnits / metrics.grossUnits) * 100).toFixed(1) : 0}% rate
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Amount Settled</span>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(metrics.amountSettled)}</p>
          <span className="text-[10px] text-muted-foreground">Pending: {formatINR(metrics.amountPending)}</span>
        </div>
      </div>

      {/* 2. Responsive Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales vs Expenses vs Earnings */}
        <ChartCardContainer
          title="Sales vs Total Expenses vs Net Earnings"
          description="High-level financial comparison across the entire reporting period."
          badge="P&L Overall"
        >
          <GroupedBarChart data={finComparison} isCurrency={true} height={280} />
        </ChartCardContainer>

        {/* Chart 2: Units Breakdown */}
        <ChartCardContainer
          title="Units Progression: Gross vs Returned/Cancelled vs Net"
          description="How many units were ordered, returned/cancelled, and net delivered."
          badge="Units Flow"
        >
          <VerticalBarChart data={unitsComparison} height={280} />
        </ChartCardContainer>

        {/* Chart 3: Order Status Distribution */}
        <ChartCardContainer
          title="Orders by Status"
          description="Distribution of operational order lifecycle statuses."
          badge="Orders P&L"
        >
          <VerticalBarChart data={orderStatuses} height={280} />
        </ChartCardContainer>

        {/* Chart 4: Fulfillment Type */}
        <ChartCardContainer
          title="Fulfillment Type Distribution"
          description="Flipkart Assured (FA) vs Non-FA / Standard seller fulfillment."
          badge="Logistics Mode"
        >
          <PieDonutChart data={fulfillments} height={280} />
        </ChartCardContainer>
      </div>
    </div>
  );
}
