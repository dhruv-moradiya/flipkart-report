"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Terminal,
  FileQuestion,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useExcelData } from "@/context/excel-context";
import { ReportManager } from "@/features/reports/components/report-manager";
import { DashboardOverview } from "@/features/returns/components/dashboard-overview";
import { TopReasonsCard } from "@/features/returns/components/top-reasons-card";
import { TopProductsCard } from "@/features/returns/components/top-products-card";
import { ReturnsDataTable } from "@/features/returns/components/returns-data-table";
import { OrderJourneySheet } from "@/features/reports/components/order-journey-sheet";

export default function TablePage() {
  const {
    records,
    analytics,
    fileName,
    sheetNames,
    pnlReport,
    clearData,
    logToConsole,
  } = useExcelData();

  if (records.length === 0 || !analytics) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <Card className="max-w-md w-full text-center p-8 border-border shadow-xs">
          <CardContent className="space-y-4 pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">No Flipkart Returns Report Loaded</h2>
              <p className="text-xs text-muted-foreground">
                Upload your official 43-column Flipkart Returns report to view reverse logistics analytics and the interactive table.
              </p>
            </div>
            <Button asChild className="w-full gap-2 mt-4 text-xs cursor-pointer">
              <Link href="/">
                <Upload className="h-4 w-4" />
                Upload Flipkart Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full bg-background p-4 md:p-6 text-foreground space-y-5">
      {/* Top Flipkart Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-8 w-8 shrink-0 bg-background cursor-pointer">
            <Link href="/" title="Back to Upload">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  Flipkart Returns Analytics
                </h1>
                <Badge variant="secondary" className="text-[11px] font-mono font-medium">
                  {fileName || "Report"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Domain Reducers • {sheetNames.length} Sheet(s) •{" "}
                {analytics.overview.totalReturns.toLocaleString()} Returns Total
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pnlReport && (
            <Button asChild variant="default" size="sm" className="gap-1.5 text-xs h-8 cursor-pointer">
              <Link href="/pnl">
                <TrendingUp className="h-3.5 w-3.5" />
                View P&L Dashboard
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={logToConsole}
            className="gap-1.5 text-xs h-8 bg-background cursor-pointer"
          >
            <Terminal className="h-3.5 w-3.5" />
            Log Analytics
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8 bg-background cursor-pointer">
            <Link href="/" onClick={clearData}>
              <RefreshCw className="h-3.5 w-3.5" />
              Upload New Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Uploaded Reports Status Bar */}
      <ReportManager />

      {/* Domain Analytics Overview */}
      <DashboardOverview analytics={analytics} />

      {/* Top Reasons & Products Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopReasonsCard reasonAnalytics={analytics.reason} totalReturns={analytics.overview.totalReturns} />
        <TopProductsCard productAnalytics={analytics.product} />
      </div>

      {/* 43-Column Production Returns Data Table */}
      <ReturnsDataTable records={records} fileName={fileName || "Flipkart_Returns"} />

      {/* Global Order Journey Drawer */}
      <OrderJourneySheet />
    </main>
  );
}
