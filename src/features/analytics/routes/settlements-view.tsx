"use client";

import React, { useState } from "react";
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
import { MonthlySettlementClearanceView } from "@/components/settlements/monthly-settlement-clearance-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, BarChart3, Layers } from "lucide-react";

export function SettlementsView() {
  const { pnlReport } = useExcelData();
  const [activeTab, setActiveTab] = useState<string>("clearance");

  const comparison = pnlReport ? getSettlementComparison(pnlReport) : [];
  const txnStatuses = pnlReport ? getTransactionsByStatus(pnlReport.orders) : [];
  const txnReasons = pnlReport ? getTransactionAmountByReason(pnlReport.orders) : [];
  const payoutTimeline = pnlReport ? getSettlementTimeline(pnlReport.orders) : [];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border">
          <TabsTrigger value="clearance" className="text-xs font-medium cursor-pointer gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Monthly Clearance & Orders Left
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-xs font-medium cursor-pointer gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Settlement Flow & Trends
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Monthly Clearance Ledger & Itemized Table */}
        <TabsContent value="clearance" className="space-y-4">
          <MonthlySettlementClearanceView />
        </TabsContent>

        {/* TAB 2: Visual Charts & Timelines */}
        <TabsContent value="charts" className="space-y-6">
          {!pnlReport || !pnlReport.skuLevel || pnlReport.skuLevel.length === 0 ? (
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
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
