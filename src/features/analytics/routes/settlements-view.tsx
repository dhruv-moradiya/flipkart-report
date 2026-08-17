"use client";

import React from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getSettlementComparison,
  getTransactionsByStatus,
  getTransactionAmountByReason,
  getSettlementTimeline,
} from "../calculations/settlements";
import { ChartCardContainer } from "../charts/chart-container";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { PieDonutChart } from "../charts/pie-donut-chart";
import { LineTimeChart } from "../charts/line-time-chart";
import { MissingReportBanner } from "../components/missing-report-banner";

export function SettlementsView() {
  const { pnlReport } = useExcelData();

  if (!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="pnl"
        featureTitle="Settlement & Payout Analytics"
        benefits={[
          "Projected bank settlement vs actual amounts settled & pending",
          "Settlement transaction status breakdown",
          "Transaction amounts grouped by reason",
          "Bank payout timeline over payment dates",
        ]}
      />
    );
  }

  const comparison = getSettlementComparison(pnlReport);
  const txnStatuses = getTransactionsByStatus(pnlReport.orders);
  const txnReasons = getTransactionAmountByReason(pnlReport.orders);
  const payoutTimeline = getSettlementTimeline(pnlReport.orders);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Projected vs Settled vs Pending */}
        <ChartCardContainer
          title="Projected Bank Settlement vs Settled vs Pending"
          description="Compares estimated bank payout against realized bank deposits."
          badge="Settlement Flow"
          className="lg:col-span-2"
        >
          <VerticalBarChart data={comparison} height={300} />
        </ChartCardContainer>

        {/* Chart 2: Transaction Status */}
        {txnStatuses.length > 0 && (
          <ChartCardContainer
            title="Settlement Transactions by Status"
            description="Status of individual NEFT payout installments."
            badge="Transactions"
          >
            <PieDonutChart data={txnStatuses} height={280} />
          </ChartCardContainer>
        )}

        {/* Chart 3: Transaction Reason */}
        {txnReasons.length > 0 && (
          <ChartCardContainer
            title="Transaction Amount by Reason"
            description="Order settlements vs reversals vs adjustments."
            badge="Reasons"
          >
            <VerticalBarChart data={txnReasons} height={280} />
          </ChartCardContainer>
        )}

        {/* Chart 4: Payout Timeline */}
        <ChartCardContainer
          title="Settlement Payouts over Time"
          description="Actual bank settlement amounts disbursed by payment date."
          badge="Payout Timeline"
          className="lg:col-span-2"
        >
          <LineTimeChart
            data={payoutTimeline}
            isCurrency={true}
            primaryLabel="Disbursed (INR)"
            height={300}
          />
        </ChartCardContainer>
      </div>
    </div>
  );
}
