"use client";

import React, { useState } from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getReturnStatusDistribution,
  getTopReturnReasons,
  getTopReturnSubReasons,
  getReturnTypeDistribution,
  getReturnConditionDistribution,
  getReturnBreachDistribution,
  getReturnTimelineSeries,
} from "../calculations/returns";
import { ChartCardContainer } from "../charts/chart-container";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { HorizontalBarChart } from "../charts/horizontal-bar-chart";
import { PieDonutChart } from "../charts/pie-donut-chart";
import { LineTimeChart } from "../charts/line-time-chart";
import { TopNSelect } from "../components/top-n-select";
import { MissingReportBanner } from "../components/missing-report-banner";
import { TopNCount } from "../types/analytics.types";

export function ReturnsView() {
  const { records } = useExcelData();
  const [topN, setTopN] = useState<TopNCount>(10);

  if (!records || records.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="returns"
        featureTitle="Detailed Reverse Logistics Analytics"
        benefits={[
          "Top customer return reasons and granular sub-reasons",
          "Customer returns (RVP) vs Courier returns (RTO)",
          "Returned merchandise condition grading (Damaged, Intact, Seal Broken)",
          "SLA breach tracking and daily reverse timeline trends",
        ]}
      />
    );
  }

  const statuses = getReturnStatusDistribution(records);
  const reasons = getTopReturnReasons(records, topN);
  const subReasons = getTopReturnSubReasons(records, topN);
  const returnTypes = getReturnTypeDistribution(records);
  const conditions = getReturnConditionDistribution(records);
  const breaches = getReturnBreachDistribution(records);
  const timelineSeries = getReturnTimelineSeries(records);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <span className="text-xs font-semibold text-foreground">
          Analyzing {records.length.toLocaleString()} Flipkart return records
        </span>
        <TopNSelect value={topN} onChange={setTopN} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Return Status */}
        <ChartCardContainer
          title="Return Operational Status"
          description="Distribution of returns across in-transit, completed, and pickup stages."
          badge="Status"
        >
          <VerticalBarChart data={statuses} height={280} />
        </ChartCardContainer>

        {/* Chart 2: Return Type */}
        <ChartCardContainer
          title="Customer Return (RVP) vs Courier Return (RTO)"
          description="Doorstep customer returns vs undelivered courier returns."
          badge="Type"
        >
          <PieDonutChart data={returnTypes} height={280} />
        </ChartCardContainer>

        {/* Chart 3: Top Return Reasons */}
        <ChartCardContainer
          title="Top Return Reasons"
          description="Primary reasons reported for returning merchandise."
          badge="Root Cause"
          className="lg:col-span-2"
        >
          <HorizontalBarChart data={reasons} barColor="var(--chart-5)" />
        </ChartCardContainer>

        {/* Chart 4: Return Sub-reasons */}
        <ChartCardContainer
          title="Top Return Sub-Reasons"
          description="Granular defect descriptions and customer dissatisfaction reasons."
          badge="Sub-Reasons"
          className="lg:col-span-2"
        >
          <HorizontalBarChart data={subReasons} barColor="var(--chart-3)" />
        </ChartCardContainer>

        {/* Chart 5: Final Condition of Returned Product */}
        {conditions.length > 0 && (
          <ChartCardContainer
            title="Returned Product Condition"
            description="Inspection condition graded at warehouse receipt."
            badge="Inspection"
          >
            <VerticalBarChart data={conditions} height={280} />
          </ChartCardContainer>
        )}

        {/* Chart 6: SLA Delivery Breaches */}
        <ChartCardContainer
          title="Return Delivery SLA Compliance"
          description="Returns delivered within committed SLA vs SLA breached."
          badge="SLA"
        >
          <PieDonutChart data={breaches} height={280} />
        </ChartCardContainer>

        {/* Chart 7: Return Activity Timeline */}
        <ChartCardContainer
          title="Return Activity Timeline"
          description="Returns requested and completed per day across the reporting period."
          badge="Daily Activity"
          className="lg:col-span-2"
        >
          <LineTimeChart data={timelineSeries} primaryLabel="Requested" secondaryLabel="Completed" height={300} />
        </ChartCardContainer>
      </div>
    </div>
  );
}
