"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
  Calendar,
  Loader2,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useExcelData } from "@/context/excel-context";
import { useReportImports } from "@/hooks/use-report-imports";
import { useAvailablePeriods } from "@/hooks/use-actual-profit";
import { PnlDashboardOverview } from "@/features/pnl/components/pnl-dashboard-overview";
import { PnlCharts } from "@/features/pnl/components/pnl-charts";
import { SkuPnlTable } from "@/features/pnl/components/sku-pnl-table";
import { OrdersPnlTable } from "@/features/pnl/components/orders-pnl-table";
import { OrderDetailSheet } from "@/features/pnl/components/order-detail-sheet";
import { OrderJourneySheet } from "@/features/reports/components/order-journey-sheet";
import { ReportManager } from "@/features/reports/components/report-manager";
import { OrderPnlRecord } from "@/features/pnl/types/pnl.types";

export default function PnlPage() {
  const {
    pnlReport,
    pnlAnalytics,
    fileName,
    openOrderJourney,
    isDbLoading,
    activeReportingPeriod,
    activeReportId,
    loadReportFromBackend,
  } = useExcelData();

  const router = useRouter();
  const { data: allReports = [] } = useReportImports();
  const { data: availablePeriods = [] } = useAvailablePeriods();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedOrder, setSelectedOrder] = useState<OrderPnlRecord | null>(null);

  // Sync activeTab and Order Journey with URL query params (tab, sku, orderId)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    const skuParam = url.searchParams.get("sku");
    const orderIdParam = url.searchParams.get("orderId");

    if (tabParam && ["overview", "skus", "orders"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (skuParam) {
      setActiveTab("skus");
    }

    if (orderIdParam) {
      openOrderJourney(orderIdParam);
    }

    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const currentTab = currentUrl.searchParams.get("tab");
      const currentSku = currentUrl.searchParams.get("sku");
      const currentOrderId = currentUrl.searchParams.get("orderId");

      if (currentTab && ["overview", "skus", "orders"].includes(currentTab)) {
        setActiveTab(currentTab);
      } else if (currentSku) {
        setActiveTab("skus");
      }
      if (currentOrderId) {
        openOrderJourney(currentOrderId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [openOrderJourney]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== tab) {
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    loadReportFromBackend(newPeriod);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("period", newPeriod);
      window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  if (isDbLoading && !pnlReport) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-foreground">Loading P&L Dataset from Database</h2>
          <p className="text-xs text-muted-foreground">
            Fetching normalized SKU and Order financial records from backend database...
          </p>
        </div>
      </main>
    );
  }

  if (!pnlReport || !pnlAnalytics) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">No P&L Report in Database</h2>
          <p className="text-xs text-muted-foreground">
            Please upload a Flipkart SKU-level P&L report on the home screen to persist and view financial data.
          </p>
          <Button asChild variant="default" size="sm" className="gap-2 cursor-pointer">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Upload Flipkart Report
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background text-foreground flex flex-col">
      {/* Top SaaS Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-background cursor-pointer">
              <Link href="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                Upload Portal
              </Link>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-foreground">
                  Flipkart SKU-level P&L + Orders P&L
                </h1>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Database Source
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {fileName || "P&L Report"} • {pnlAnalytics.overview.totalSkus} SKUs • {pnlAnalytics.orders.totalOrderItems} Order Items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Report Selector Dropdown */}
            {allReports.length > 0 && (
              <Select
                value={activeReportId || allReports[0]?._id}
                onValueChange={(newId) => router.push(`/pnl/${newId}`)}
              >
                <SelectTrigger className="h-7 text-xs w-[170px] font-medium bg-background border-border">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Select Report" />
                </SelectTrigger>
                <SelectContent className="text-xs max-h-60">
                  {allReports.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      <span className="font-semibold">{r.periodLabel}</span>{" "}
                      <span className="text-[10px] text-muted-foreground">({r.fileName.slice(0, 16)}...)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-mono">
              Net Earnings: ₹{pnlAnalytics.overview.totalNetEarnings.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-mono">
              Pending: ₹{pnlAnalytics.overview.totalAmountPending.toLocaleString()}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Uploaded Reports Status Bar */}
        <ReportManager />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="overview" className="gap-2 text-xs cursor-pointer">
              <BarChart3 className="h-3.5 w-3.5" />
              Financial Overview
            </TabsTrigger>
            <TabsTrigger value="skus" className="gap-2 text-xs cursor-pointer">
              <Layers className="h-3.5 w-3.5" />
              SKU Performance Table ({pnlAnalytics.overview.totalSkus})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 text-xs cursor-pointer">
              <ShoppingBag className="h-3.5 w-3.5" />
              Orders P&L Table ({pnlAnalytics.orders.totalOrderItems})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Financial Overview */}
          <TabsContent value="overview" className="space-y-6">
            <PnlDashboardOverview analytics={pnlAnalytics} />
            <PnlCharts analytics={pnlAnalytics} onSelectSku={() => handleTabChange("skus")} />
          </TabsContent>

          {/* Tab 2: SKU Performance Table */}
          <TabsContent value="skus" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">SKU Financial Performance Directory</h2>
              <p className="text-xs text-muted-foreground">
                Official Flipkart SKU metrics from database. Click any row to view full financial cards and connected orders.
              </p>
            </div>
            <SkuPnlTable
              skus={pnlAnalytics.skus.allSkus}
              fileName={pnlReport.fileName}
              onSelectOrder={(order) => openOrderJourney(order.orderId)}
            />
          </TabsContent>

          {/* Tab 3: Orders P&L Table */}
          <TabsContent value="orders" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">Orders P&L Individual Journey Table</h2>
              <p className="text-xs text-muted-foreground">
                Individual order items from database. Click any <strong>Order ID</strong> to view the complete Order Journey with connected return tracking.
              </p>
            </div>
            <OrdersPnlTable
              orders={pnlReport.orders}
              fileName={pnlReport.fileName}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Order Journey Drawer */}
      <OrderJourneySheet />

      {/* Raw Order Detail Sheet fallback */}
      <OrderDetailSheet
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </main>
  );
}
