"use client";

import React, { useState } from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getFinancialFunnelProgression,
  getSkuEarningsDistribution,
  getSettlementBalance,
  getInputTaxCreditsBreakdown,
} from "../calculations/financials";
import { ChartCardContainer } from "../charts/chart-container";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { HorizontalBarChart } from "../charts/horizontal-bar-chart";
import { PieDonutChart } from "../charts/pie-donut-chart";
import { TopNSelect } from "../components/top-n-select";
import { MissingReportBanner } from "../components/missing-report-banner";
import { TopNCount } from "../types/analytics.types";

export function FinancialsView() {
  const { pnlReport } = useExcelData();
  const [topN, setTopN] = useState<TopNCount>(10);

  if (!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="pnl"
        featureTitle="Financial & Revenue Analytics"
        benefits={[
          "Revenue progression from Estimated Sales to Net Earnings",
          "SKU Net Earnings contributions",
          "Bank settlement balance (Settled vs Pending)",
          "Input Tax Credits (ITC) tax recovery breakdown",
        ]}
      />
    );
  }

  const funnel = getFinancialFunnelProgression(pnlReport);
  const topEarnings = getSkuEarningsDistribution(pnlReport, topN);
  const settlementBalance = getSettlementBalance(pnlReport);
  const itcBreakdown = getInputTaxCreditsBreakdown(pnlReport);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <span className="text-xs font-semibold text-foreground">
          Financial Progression & Revenue Economics
        </span>
        <TopNSelect value={topN} onChange={setTopN} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Financial Progression Funnel */}
        <ChartCardContainer
          title="Financial Progression Waterfall"
          description="Step-by-step financial flow from Gross Sales down to Net Earnings."
          badge="Funnel Flow"
          className="lg:col-span-2"
        >
          <VerticalBarChart data={funnel} height={320} />
        </ChartCardContainer>

        {/* Chart 2: Top SKUs by Earnings */}
        <ChartCardContainer
          title="Top SKUs by Net Earnings"
          description="SKUs generating the largest net profit share."
          badge="Earnings"
        >
          <HorizontalBarChart data={topEarnings} barColor="var(--chart-1)" />
        </ChartCardContainer>

        {/* Chart 3: Settlement Balance */}
        <ChartCardContainer
          title="Settlement Balance"
          description="Amount already deposited to bank vs amount pending."
          badge="Payout Balance"
        >
          <PieDonutChart
            data={settlementBalance}
            isCurrency={true}
            height={280}
          />
        </ChartCardContainer>

        {/* Chart 4: Input Tax Credits */}
        <ChartCardContainer
          title="Input Tax Credits (ITC) Recovered"
          description="ITC for GST & TCS vs TDS deductions claimed back."
          badge="Tax Credits"
          className="lg:col-span-2"
        >
          <VerticalBarChart data={itcBreakdown} height={260} />
        </ChartCardContainer>
      </div>
    </div>
  );
}
