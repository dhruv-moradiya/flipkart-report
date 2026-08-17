"use client";

import React, { useState } from "react";
import { useExcelData } from "@/context/excel-context";
import {
  getOrdersByStatus,
  getOrdersByFulfillmentType,
  getOrdersByPaymentMode,
  getOrdersByChannel,
  getTopOrderValueBySku,
} from "../calculations/orders";
import { ChartCardContainer } from "../charts/chart-container";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { HorizontalBarChart } from "../charts/horizontal-bar-chart";
import { PieDonutChart } from "../charts/pie-donut-chart";
import { TopNSelect } from "../components/top-n-select";
import { MissingReportBanner } from "../components/missing-report-banner";
import { TopNCount } from "../types/analytics.types";

export function OrdersView() {
  const { pnlReport } = useExcelData();
  const [topN, setTopN] = useState<TopNCount>(10);

  if (!pnlReport || !pnlReport.orders || pnlReport.orders.length === 0) {
    return (
      <MissingReportBanner
        reportRequired="pnl"
        featureTitle="Orders Analytics"
        benefits={[
          "Orders breakdown by status and fulfillment",
          "Prepaid vs Cash on Delivery (COD) distribution",
          "Marketplace channel distribution (Flipkart vs Shopsy)",
          "Billed order value per SKU",
        ]}
      />
    );
  }

  const orders = pnlReport.orders;
  const orderStatuses = getOrdersByStatus(orders);
  const fulfillments = getOrdersByFulfillmentType(orders);
  const paymentModes = getOrdersByPaymentMode(orders);
  const channels = getOrdersByChannel(orders);
  const topOrderValues = getTopOrderValueBySku(orders, topN);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <span className="text-xs font-semibold text-foreground">
          Analyzing {orders.length.toLocaleString()} individual order items
        </span>
        <TopNSelect value={topN} onChange={setTopN} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Orders by Status */}
        <ChartCardContainer
          title="Orders by Lifecycle Status"
          description="Distribution across delivered, returned, cancelled, and in-transit orders."
          badge="Status"
        >
          <VerticalBarChart data={orderStatuses} height={280} />
        </ChartCardContainer>

        {/* Chart 2: Orders by Fulfillment Type */}
        <ChartCardContainer
          title="Orders by Fulfillment Model"
          description="Flipkart Assured (FA) vs Non-FA standard seller fulfillment."
          badge="Fulfillment"
        >
          <PieDonutChart data={fulfillments} height={280} />
        </ChartCardContainer>

        {/* Chart 3: Payment Mode Distribution */}
        <ChartCardContainer
          title="Payment Mode Distribution"
          description="Prepaid transactions (UPI, Cards, Netbanking) vs Cash on Delivery (COD)."
          badge="Payment"
        >
          <PieDonutChart data={paymentModes} height={280} />
        </ChartCardContainer>

        {/* Chart 4: Channel of Sale */}
        <ChartCardContainer
          title="Channel of Sale Distribution"
          description="Orders received through Flipkart Marketplace vs Shopsy."
          badge="Channel"
        >
          <VerticalBarChart data={channels} height={280} />
        </ChartCardContainer>

        {/* Chart 5: Top SKUs by Billed Order Value */}
        <ChartCardContainer
          title="Top SKUs by Billed Order Item Value"
          description="Total gross customer billing value grouped by SKU."
          badge="Order Value"
          className="lg:col-span-2"
        >
          <HorizontalBarChart data={topOrderValues} barColor="var(--chart-1)" />
        </ChartCardContainer>
      </div>
    </div>
  );
}
