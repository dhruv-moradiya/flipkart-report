"use client";

import React, { useState } from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getAllFeeCategoriesAggregated,
  getSkuFeeBreakdown,
  getShippingCostComparison,
  getMarketplaceFeesBreakdown,
  getTaxBreakdown,
  FEE_SELECT_OPTIONS,
} from "../calculations/fees";
import { ChartCardContainer } from "../charts/chart-container";
import { HorizontalBarChart } from "../charts/horizontal-bar-chart";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { GroupedBarChart } from "../charts/grouped-bar-chart";
import { TopNSelect } from "../components/top-n-select";
import { MissingReportBanner } from "../components/missing-report-banner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNCount } from "../types/analytics.types";

export function FeesView() {
  const { pnlReport } = useExcelData();
  const [topN, setTopN] = useState<TopNCount>(10);
  const [selectedFee, setSelectedFee] = useState<string>("commissionFee");

  if (!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="pnl"
        featureTitle="Fees & Expenses Analytics"
        benefits={[
          "All 20 marketplace expense and fee category breakdowns",
          "SKU-level drill-down for any specific fee type",
          "Forward vs Reverse return shipping cost comparison",
          "Core marketplace charges (Commission, Fixed, Collection)",
          "Direct tax breakdown (GST, TCS, TDS)",
        ]}
      />
    );
  }

  const allFees = getAllFeeCategoriesAggregated(pnlReport);
  const skuFeeBreakdown = getSkuFeeBreakdown(pnlReport, selectedFee, topN);
  const shippingComparison = getShippingCostComparison(pnlReport, topN);
  const marketplaceCore = getMarketplaceFeesBreakdown(pnlReport);
  const taxes = getTaxBreakdown(pnlReport);

  const selectedFeeLabel = FEE_SELECT_OPTIONS.find((f) => f.id === selectedFee)?.label || "Selected Fee";

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <span className="text-xs font-semibold text-foreground">
          Marketplace Fee Breakdown across {allFees.length} active fee categories
        </span>
        <TopNSelect value={topN} onChange={setTopN} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: All Expense Categories Aggregated */}
        <ChartCardContainer
          title="Expense Composition (All 20 Categories)"
          description="Aggregate fee magnitude ranked from highest to lowest deduction."
          badge="Deductions"
          className="lg:col-span-2"
        >
          <HorizontalBarChart data={allFees} barColor="var(--chart-5)" height={380} />
        </ChartCardContainer>

        {/* Chart 2: Fee by SKU with Dynamic Filter */}
        <ChartCardContainer
          title={`${selectedFeeLabel} by SKU`}
          description={`Top SKUs incurring the highest ${selectedFeeLabel.toLowerCase()} deductions.`}
          badge="Fee Drilldown"
          actionSlot={
            <Select value={selectedFee} onValueChange={setSelectedFee}>
              <SelectTrigger className="h-7 text-xs w-[180px] bg-background">
                <SelectValue placeholder="Select Fee" />
              </SelectTrigger>
              <SelectContent>
                {FEE_SELECT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          className="lg:col-span-2"
        >
          <HorizontalBarChart data={skuFeeBreakdown} barColor="var(--chart-3)" />
        </ChartCardContainer>

        {/* Chart 3: Forward vs Reverse Shipping Cost */}
        <ChartCardContainer
          title="Forward vs Reverse Shipping Costs"
          description="Compares outbound delivery costs vs reverse return shipping charges per SKU."
          badge="Logistics Cost"
          className="lg:col-span-2"
        >
          <GroupedBarChart data={shippingComparison} isCurrency={true} height={320} />
        </ChartCardContainer>

        {/* Chart 4: Core Marketplace Fees */}
        <ChartCardContainer
          title="Core Marketplace Fees"
          description="Commission vs Fixed Fee vs Collection Fee."
          badge="Platform Fees"
        >
          <VerticalBarChart data={marketplaceCore} height={280} />
        </ChartCardContainer>

        {/* Chart 5: Tax Breakdown */}
        <ChartCardContainer
          title="Tax Deductions Breakdown"
          description="GST on services vs TCS & TDS withheld."
          badge="Taxes"
        >
          <VerticalBarChart data={taxes} height={280} />
        </ChartCardContainer>
      </div>
    </div>
  );
}
