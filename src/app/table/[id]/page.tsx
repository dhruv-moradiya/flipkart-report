"use client";

import React, { useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Terminal,
  FileQuestion,
  RefreshCw,
  TrendingUp,
  Loader2,
  Calendar,
  RotateCcw,
  FileSpreadsheet,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { useExcelData } from "@/context/excel-context";
import { useReportImports } from "@/hooks/use-report-imports";
import { DashboardOverview } from "@/features/returns/components/dashboard-overview";
import { TopReasonsCard } from "@/features/returns/components/top-reasons-card";
import { TopProductsCard } from "@/features/returns/components/top-products-card";
import { ReturnsDataTable } from "@/features/returns/components/returns-data-table";
import { OrderJourneySheet } from "@/features/reports/components/order-journey-sheet";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TableReportByIdPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();

  const {
    records,
    analytics,
    fileName,
    sheetNames,
    pnlReport,
    isDbLoading,
    activeReturnsReportId,
    loadReturnsFromBackend,
    clearData,
    logToConsole,
    openOrderJourney,
    uploadedReportsState,
  } = useExcelData();

  const { data: allReports = [] } = useReportImports();
  const returnReports = allReports.filter(
    (r) =>
      r.reportType === "FLIPKART_RETURNS" ||
      r.fileName.toLowerCase().includes("return") ||
      (r.skuCount === 0 && (r.returnCount || 0) > 0)
  );

  const currentReport = allReports.find((r) => r._id === reportId);

  // Load from DB when reportId route param changes
  useEffect(() => {
    if (reportId && activeReturnsReportId !== reportId) {
      loadReturnsFromBackend(reportId);
    }
  }, [reportId, activeReturnsReportId, loadReturnsFromBackend]);

  // Sync Order Journey query param (if opened via deep link ?orderId=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const orderIdParam = url.searchParams.get("orderId");
    if (orderIdParam) {
      openOrderJourney(orderIdParam);
    }

    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const currentOrderId = currentUrl.searchParams.get("orderId");
      if (currentOrderId) {
        openOrderJourney(currentOrderId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [openOrderJourney]);

  const handleReportSwitch = (newReportId: string) => {
    router.push(`/table/${newReportId}`);
  };

  if (isDbLoading && records.length === 0) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse shadow-xs">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              Loading Flipkart Returns Report
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Fetching 43-column reverse logistics records for ID: {reportId}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (records.length === 0 || !analytics) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <Card className="max-w-md w-full text-center p-8 border-border shadow-xs">
          <CardContent className="space-y-4 pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">
                Flipkart Returns Report Not Found
              </h2>
              <p className="text-xs text-muted-foreground">
                Could not find Returns report dataset for ID:{" "}
                <code className="font-mono text-[11px]">{reportId}</code>.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {returnReports.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/table/${returnReports[0]._id}`)}
                  className="text-xs cursor-pointer"
                >
                  Open Available Report ({returnReports[0].periodLabel})
                </Button>
              )}
              <Button asChild className="w-full gap-2 text-xs cursor-pointer">
                <Link href="/">
                  <Upload className="h-4 w-4" />
                  Upload Flipkart Report
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      {/* Top Sticky SaaS Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Brand, Back & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1.5 text-xs bg-background hover:bg-muted cursor-pointer shadow-2xs shrink-0"
            >
              <Link href="/reports" title="Back to Reports Archive">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reports Archive</span>
              </Link>
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm font-bold tracking-tight text-foreground truncate">
                    Flipkart Returns Analytics
                  </h1>
                  {currentReport && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {currentReport.periodLabel}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono font-medium px-2 py-0.5"
                  >
                    {analytics.overview.totalReturns.toLocaleString()} Returns
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono truncate">
                  <span className="truncate max-w-[260px] sm:max-w-[400px]">
                    {fileName || "Returns Report"}
                  </span>
                  {fileName && (
                    <CopyButton
                      text={fileName}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions, Dropdown & Route Switcher */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {/* Returns Report Switcher Dropdown */}
            {returnReports.length > 1 && (
              <Select
                value={activeReturnsReportId || reportId}
                onValueChange={handleReportSwitch}
              >
                <SelectTrigger className="h-8 text-xs w-[190px] font-medium bg-background border-border shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Switch Report" />
                </SelectTrigger>
                <SelectContent className="text-xs max-h-60">
                  {returnReports.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      <span className="font-semibold">{r.periodLabel}</span>{" "}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({(r.returnCount || r.validRows || 0)} returns)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {pnlReport && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs bg-background text-foreground hover:bg-muted cursor-pointer shadow-2xs"
              >
                <Link href="/pnl">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  P&L Dashboard
                </Link>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={logToConsole}
              className="h-8 px-2.5 gap-1.5 text-xs bg-background cursor-pointer shadow-2xs hidden sm:inline-flex"
              title="Log analytics to console"
            >
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              Log
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1.5 text-xs bg-background cursor-pointer shadow-2xs"
            >
              <Link href="/" onClick={clearData}>
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                Upload New
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Cross-Dataset Connection Strip (if both P&L and Returns active) */}
        {uploadedReportsState.bothActive && (
          <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs text-foreground shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Cross-Report Intelligence Linked:
                </span>{" "}
                <span className="text-muted-foreground">
                  Returns tracking records are connected with SKU unit economics and Orders P&L.
                </span>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-background hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 cursor-pointer shrink-0"
            >
              <Link href="/pnl">View P&L Waterfall</Link>
            </Button>
          </div>
        )}

        {/* 1. Overview KPIs */}
        <DashboardOverview analytics={analytics} />

        {/* 2. Top Reasons & Top Products Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopReasonsCard
            reasonAnalytics={analytics.reason}
            totalReturns={analytics.overview.totalReturns}
          />
          <TopProductsCard productAnalytics={analytics.product} />
        </div>

        {/* 3. 43-Column Production Returns Data Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Reverse Tracking Records & Journey Drilldown
              </h2>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {records.length.toLocaleString()} rows
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Click any order row to open full lifecycle timeline
            </span>
          </div>

          <ReturnsDataTable
            records={records}
            fileName={fileName || "Flipkart_Returns"}
          />
        </div>

        {/* Global Order Journey Sheet */}
        <OrderJourneySheet />
      </main>
    </div>
  );
}
