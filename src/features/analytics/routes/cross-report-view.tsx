"use client";

import React from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getSalesVsReturnRateScatter,
  getEarningsVsReturnRateScatter,
  getSalesVsCustomerReturnsScatter,
  getCancellationVsEarningsScatter,
} from "../calculations/cross-report";
import { ChartCardContainer } from "../charts/chart-container";
import { CrossReportScatterChart } from "../charts/scatter-chart";
import { MissingReportBanner } from "../components/missing-report-banner";

export function CrossReportView() {
  const { pnlReport, records, uploadedReportsState } = useExcelData();

  if (!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="both"
        featureTitle="Cross-Report Correlation Analytics"
        benefits={[
          "Sales Revenue vs Return Rate (%) correlation",
          "Net Earnings vs Return Rate (%) profitability quadrants",
          "Sales vs Customer Returns (RVP) units",
          "Cancellation units vs Net Earnings sensitivity",
        ]}
      />
    );
  }

  const salesVsReturnRate = getSalesVsReturnRateScatter(pnlReport, records);
  const earningsVsReturnRate = getEarningsVsReturnRateScatter(pnlReport, records);
  const salesVsRvp = getSalesVsCustomerReturnsScatter(pnlReport, records);
  const cancelsVsEarnings = getCancellationVsEarningsScatter(pnlReport);

  return (
    <div className="space-y-6">
      {!uploadedReportsState.bothActive && (
        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between gap-3">
          <span>
            Showing correlation derived from <strong>P&L report</strong>. Upload a <strong>Returns report</strong> to cross-validate with verbatim customer returns and tracking data.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter 1: Sales vs Return Rate */}
        <ChartCardContainer
          title="Sales Revenue vs Return Rate (%)"
          description="Identifies high-revenue SKUs that suffer from excessive return rates."
          badge="Sales vs Returns"
        >
          <CrossReportScatterChart
            data={salesVsReturnRate}
            xAxisLabel="Sales (INR)"
            yAxisLabel="Return Rate (%)"
            isXCurrency={true}
            isYPercent={true}
          />
        </ChartCardContainer>

        {/* Scatter 2: Earnings vs Return Rate */}
        <ChartCardContainer
          title="Net Earnings vs Return Rate (%)"
          description="Uncovers highly profitable SKUs vs products eroding seller margins."
          badge="Profit vs Returns"
        >
          <CrossReportScatterChart
            data={earningsVsReturnRate}
            xAxisLabel="Net Earnings (INR)"
            yAxisLabel="Return Rate (%)"
            isXCurrency={true}
            isYPercent={true}
          />
        </ChartCardContainer>

        {/* Scatter 3: Sales vs Customer Returns (RVP) */}
        <ChartCardContainer
          title="Sales Revenue vs Customer Returns (RVP Units)"
          description="Examines customer return unit volume relative to total sales generated."
          badge="Sales vs RVP"
        >
          <CrossReportScatterChart
            data={salesVsRvp}
            xAxisLabel="Sales (INR)"
            yAxisLabel="RVP Units"
            isXCurrency={true}
            isYPercent={false}
          />
        </ChartCardContainer>

        {/* Scatter 4: Cancellations vs Net Earnings */}
        <ChartCardContainer
          title="Order Cancellations vs Net Earnings"
          description="Analyzes how pre-delivery cancellations impact net SKU profitability."
          badge="Cancels vs Earnings"
        >
          <CrossReportScatterChart
            data={cancelsVsEarnings}
            xAxisLabel="Cancellations (Units)"
            yAxisLabel="Net Earnings (INR)"
            isXCurrency={false}
            isYPercent={false}
          />
        </ChartCardContainer>
      </div>
    </div>
  );
}
