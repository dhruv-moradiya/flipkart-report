"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Terminal,
  X,
  RefreshCw,
  Table as TableIcon,
  ArrowRight,
  ShoppingBag,
  Layers,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExcelParser } from "@/hooks/use-excel-parser";
import { ReportManager } from "@/features/reports/components/report-manager";
import { DashboardOverview } from "@/features/returns/components/dashboard-overview";
import { TopReasonsCard } from "@/features/returns/components/top-reasons-card";
import { TopProductsCard } from "@/features/returns/components/top-products-card";
import { PnlDashboardOverview } from "@/features/pnl/components/pnl-dashboard-overview";
import { PnlCharts } from "@/features/pnl/components/pnl-charts";
import { OrderJourneySheet } from "@/features/reports/components/order-journey-sheet";
import { formatBytes } from "@/lib/excel-utils";

export function FileSummaryCard() {
  const {
    activeReportType,
    records,
    analytics,
    pnlReport,
    pnlAnalytics,
    fileName,
    fileSize,
    uploadedReportsState,
    handleReset,
    triggerReLog,
    logCount,
  } = useExcelParser();

  return (
    <div className="space-y-6">
      {/* 1. Report Manager: Displays active P&L and Returns with ability to upload the other */}
      <ReportManager />

      {/* 2. Primary Analytics View according to active data */}
      {pnlReport && pnlAnalytics && (
        <div className="space-y-6">
          <PnlDashboardOverview analytics={pnlAnalytics} />
          <PnlCharts analytics={pnlAnalytics} />
        </div>
      )}

      {records.length > 0 && analytics && !pnlReport && (
        <div className="space-y-6">
          <DashboardOverview analytics={analytics} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TopReasonsCard reasonAnalytics={analytics.reason} totalReturns={analytics.overview.totalReturns} />
            <TopProductsCard productAnalytics={analytics.product} />
          </div>
        </div>
      )}

      {/* 3. Action CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pnlReport && (
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                <TableIcon className="h-4 w-4 text-foreground" />
                P&L Analytics Platform
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Explore individual SKU financial metrics, order economics, settlement status, and connected SKU-to-order journeys.
              </p>
            </div>
            <Button asChild variant="default" size="sm" className="w-full gap-2 cursor-pointer">
              <Link href="/pnl">
                Open P&L Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {records.length > 0 && (
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                <ShoppingBag className="h-4 w-4 text-foreground" />
                Returns Data Table (43 Fields)
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Explore all {records.length.toLocaleString()} return records with search, filtering, comments, and column visibility.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full gap-2 cursor-pointer bg-background">
              <Link href="/table">
                Explore Returns Table
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 font-medium text-foreground text-sm">
              <Terminal className="h-4 w-4 text-foreground" />
              Developer Reducer Console Log
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inspect calculated domain analytics objects and normalized datasets in developer console (<kbd className="rounded bg-muted px-1 text-[10px]">F12</kbd>).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerReLog}
            className="w-full gap-1.5 text-xs cursor-pointer bg-background"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Log Analytics ({logCount})
          </Button>
        </div>
      </div>

      {/* Global Order Journey Drawer */}
      <OrderJourneySheet />
    </div>
  );
}
