"use client";

import React, { useState } from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getTopSkusByEarnings,
  getTopSkusBySales,
  getTopSkusByExpenseMagnitude,
  getTopSkusByReturnRate,
  getSkuRvpVsRtoVsCancel,
  getSkuEarningsPerUnit,
} from "../calculations/sku";
import { ChartCardContainer } from "../charts/chart-container";
import { HorizontalBarChart } from "../charts/horizontal-bar-chart";
import { GroupedBarChart } from "../charts/grouped-bar-chart";
import { TopNSelect } from "../components/top-n-select";
import { MissingReportBanner } from "../components/missing-report-banner";
import { TopNCount } from "../types/analytics.types";

export function SkuView() {
  const { pnlReport, openOrderJourney } = useExcelData();
  const [topN, setTopN] = useState<TopNCount>(10);

  if (!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="pnl"
        featureTitle="SKU Performance Analytics"
        benefits={[
          "Top SKUs by Net Earnings and Sales",
          "Expense magnitude breakdown per SKU",
          "RVP vs RTO vs Cancellation comparison",
          "Earnings per Unit (EPU) profitability rankings",
        ]}
      />
    );
  }

  const skus = pnlReport.skuLevel;
  const topEarnings = getTopSkusByEarnings(skus, topN);
  const topSales = getTopSkusBySales(skus, topN);
  const topExpenses = getTopSkusByExpenseMagnitude(skus, topN);
  const topReturnRates = getTopSkusByReturnRate(skus, topN);
  const rvpRtoCancel = getSkuRvpVsRtoVsCancel(skus, topN);
  const { topProfitable, lowestProfitable } = getSkuEarningsPerUnit(skus, topN);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <span className="text-xs font-semibold text-foreground">
          Showing top {topN} of {skus.length.toLocaleString()} SKU records
        </span>
        <TopNSelect value={topN} onChange={setTopN} />
      </div>

      {/* Grid of SKU Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top SKUs by Net Earnings */}
        <ChartCardContainer
          title="Top SKUs by Net Earnings"
          description="Which SKUs generate the highest net profit after all fees and taxes."
          badge="Net Earnings"
        >
          <HorizontalBarChart data={topEarnings} barColor="var(--chart-1)" />
        </ChartCardContainer>

        {/* Chart 2: Top SKUs by Sales */}
        <ChartCardContainer
          title="Top SKUs by Net Sales"
          description="Top revenue generating catalog items across the reporting period."
          badge="Sales Revenue"
        >
          <HorizontalBarChart data={topSales} barColor="var(--chart-2)" />
        </ChartCardContainer>

        {/* Chart 3: Top SKUs by Expense Magnitude */}
        <ChartCardContainer
          title="Expense Magnitude by SKU"
          description="Total Flipkart fees charged. Preserves negative signs in financial records."
          badge="Expenses"
        >
          <HorizontalBarChart data={topExpenses} barColor="var(--chart-5)" />
        </ChartCardContainer>

        {/* Chart 4: Return + Cancellation Rate */}
        <ChartCardContainer
          title="Return & Cancellation Rate (%)"
          description="Percentage of ordered units lost to customer returns, RTO, and cancellations."
          badge="Rate %"
        >
          <HorizontalBarChart data={topReturnRates} barColor="var(--chart-3)" />
        </ChartCardContainer>

        {/* Chart 5: RVP vs RTO vs Cancellation */}
        <ChartCardContainer
          title="Customer Returns (RVP) vs Logistics Returns (RTO) vs Cancellations"
          description="Separates courier delivery failures (RTO) from customer dissatisfaction (RVP) and cancellations."
          badge="Return Split"
          className="lg:col-span-2"
        >
          <GroupedBarChart data={rvpRtoCancel} height={320} />
        </ChartCardContainer>

        {/* Chart 6: Top Profitable SKUs by EPU */}
        <ChartCardContainer
          title="Highest Earnings per Unit (EPU)"
          description="SKUs yielding the most net profit per fulfilled unit."
          badge="Profitable EPU"
        >
          <HorizontalBarChart data={topProfitable} barColor="var(--chart-1)" />
        </ChartCardContainer>

        {/* Chart 7: Lowest Earning SKUs by EPU */}
        <ChartCardContainer
          title="Lowest Earnings per Unit (EPU)"
          description="SKUs at risk of low margins or negative profitability after deductions."
          badge="Low Margin"
        >
          <HorizontalBarChart data={lowestProfitable} barColor="var(--chart-4)" />
        </ChartCardContainer>
      </div>
    </div>
  );
}
