"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useReportImports,
  useReprocessReport,
  useDeleteReport,
} from "@/hooks/use-report-imports";
import { PnlReportImportItem } from "@/types/sku-cost.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DeleteReportDialog } from "./delete-report-dialog";
import {
  FileSpreadsheet,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Receipt,
  Sparkles,
  Info,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Table as TableIcon,
  Undo2,
  Package,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeUploadedReports() {
  const { data: reports = [], isLoading } = useReportImports();
  const [selectedReport, setSelectedReport] =
    useState<PnlReportImportItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [deletingReport, setDeletingReport] =
    useState<PnlReportImportItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const reprocessMutation = useReprocessReport();
  const deleteMutation = useDeleteReport();

  const handleOpenFullSummary = (report: PnlReportImportItem) => {
    setSelectedReport(report);
    setIsSummaryOpen(true);
  };

  const handleReprocess = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReprocessingId(id);
    try {
      await reprocessMutation.mutateAsync(id);
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = (report: PnlReportImportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingReport(report);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReport) return;
    await deleteMutation.mutateAsync(deletingReport._id);
    setIsDeleteDialogOpen(false);
    setDeletingReport(null);
    if (selectedReport?._id === deletingReport._id) {
      setIsSummaryOpen(false);
      setSelectedReport(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span>Loading persistent report archive from database...</span>
      </div>
    );
  }

  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Uploaded Reports ({reports.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical Flipkart P&L and Returns reports stored permanently in
            database. Click any card to view full summary.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1.5 cursor-pointer"
        >
          <Link href="/reports">
            Manage All Reports
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Grid of Brief Summary Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report: PnlReportImportItem) => {
          const fin = report.financialSummary;
          const isReturnsReport =
            report.reportType === "FLIPKART_RETURNS" ||
            report.fileName.toLowerCase().includes("return") ||
            (report.skuCount === 0 && (report.returnCount || 0) > 0);
          const uploadDateStr = new Date(report.uploadedAt).toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          );

          return (
            <Card
              key={report._id}
              onClick={() => handleOpenFullSummary(report)}
              className="border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${
                        isReturnsReport
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isReturnsReport ? (
                        <Undo2 className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        {report.periodLabel}
                        <span className="text-[10px] font-mono text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
                          {report.reportingPeriod}
                        </span>
                      </CardTitle>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      isReturnsReport
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"
                    }
                  >
                    {isReturnsReport ? (
                      <>
                        <Undo2 className="h-3 w-3" />
                        Returns Report
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        P&L Processed
                      </>
                    )}
                  </Badge>
                </div>

                <CardDescription className="text-[11px] font-mono text-muted-foreground truncate pt-1">
                  {report.fileName} • Uploaded {uploadDateStr}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-1 pb-3 space-y-3">
                {isReturnsReport ? (
                  <>
                    {/* Quick Returns Count Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Package className="h-3.5 w-3.5 text-amber-500" />
                        {report.returnCount || report.validRows || 0} Return
                        Items
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
                      <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Return Items
                        </span>
                        <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                          {report.returnCount || report.validRows || 0}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Category
                        </span>
                        <span className="text-xs font-bold font-mono text-foreground">
                          Reverse Log
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Storage
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          Database
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quick Row Count Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        {report.skuCount} SKUs
                      </span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        {report.orderCount} Orders
                      </span>
                    </div>

                    {/* Brief Financial Metric Badges */}
                    {fin && (
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
                        <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                          <span className="text-[10px] text-muted-foreground block">
                            Net Earnings
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            ₹{fin.netEarnings.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                          <span className="text-[10px] text-muted-foreground block">
                            Net Sales
                          </span>
                          <span className="text-xs font-bold font-mono text-foreground">
                            ₹{fin.netSales.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-muted/40 text-center space-y-0.5">
                          <span className="text-[10px] text-muted-foreground block">
                            Pending Payout
                          </span>
                          <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                            ₹{fin.amountPending.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>

              <CardFooter className="p-3 px-4 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenFullSummary(report)}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  Full Summary
                </Button>

                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isReturnsReport ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer bg-background"
                    >
                      <Link href={`/table?reportId=${report._id}`}>
                        <TableIcon className="h-3.5 w-3.5 text-amber-500" />
                        Open Returns
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer bg-background"
                      >
                        <Link href={`/pnl/${report._id}`}>
                          <TableIcon className="h-3.5 w-3.5 text-primary" />
                          Open Report
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="h-7 px-2 text-[11px] gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Link
                          href={`/analytics/actual-profit?periodFilter=${report.reportingPeriod}`}
                        >
                          <Sparkles className="h-3 w-3" />
                          Profit
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Full Detailed Summary Dialog */}
      {selectedReport &&
        (() => {
          const isSelectedReturns =
            selectedReport.reportType === "FLIPKART_RETURNS" ||
            selectedReport.fileName.toLowerCase().includes("return") ||
            (selectedReport.skuCount === 0 &&
              (selectedReport.returnCount || 0) > 0);

          return (
            <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
              <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6">
                <DialogHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isSelectedReturns
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isSelectedReturns ? (
                          <Undo2 className="h-5 w-5" />
                        ) : (
                          <Calendar className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                          {selectedReport.periodLabel}{" "}
                          {isSelectedReturns
                            ? "Returns Report Summary"
                            : "P&L Full Report Summary"}
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {selectedReport.reportingPeriod}
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs font-mono text-muted-foreground">
                          {selectedReport.fileName}
                        </DialogDescription>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Database Persisted
                    </Badge>
                  </div>
                </DialogHeader>

                {isSelectedReturns ? (
                  /* Returns Ingestion & Coverage */
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Returns Ingestion Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground block">
                          Total Return Items
                        </span>
                        <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                          {selectedReport.returnCount ||
                            selectedReport.validRows ||
                            0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Ingested lines
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-[11px] text-muted-foreground block">
                          Report Category
                        </span>
                        <span className="text-base font-bold font-mono text-foreground">
                          Reverse Logistics
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Customer & Courier RTO
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-2xs space-y-1">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          Storage Status
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Normalized Returns DB
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Report Metadata & File Details
                      </h3>
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Reporting Period:
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {selectedReport.periodLabel} (
                            {selectedReport.reportingPeriod})
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Original File Name:
                          </span>
                          <span className="font-mono text-foreground truncate max-w-[300px]">
                            {selectedReport.fileName}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Uploaded Timestamp:
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(selectedReport.uploadedAt).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Hub for Returns */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Quick Actions for Returns
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          asChild
                          variant="default"
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer"
                        >
                          <Link href={`/table?reportId=${selectedReport._id}`}>
                            <TableIcon className="h-4 w-4 text-amber-500" />
                            Open Returns Analysis Table
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer"
                        >
                          <Link href="/">
                            <PlusCircle className="h-4 w-4 text-primary" />
                            Upload Additional Report
                          </Link>
                        </Button>
                      </div>

                      <div className="flex items-center justify-end pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(selectedReport, e)}
                          className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Report
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Financial Waterfall KPIs for P&L */
                  <>
                    {selectedReport.financialSummary && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Financial Performance Waterfall
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1">
                            <span className="text-[11px] text-muted-foreground block">
                              Estimated Net Sales
                            </span>
                            <span className="text-base font-bold font-mono text-foreground">
                              ₹
                              {selectedReport.financialSummary.netSales.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {selectedReport.financialSummary.netUnits}{" "}
                              fulfilled units
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1">
                            <span className="text-[11px] text-muted-foreground block">
                              Total Expenses
                            </span>
                            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                              ₹
                              {Math.abs(
                                selectedReport.financialSummary.totalExpenses,
                              ).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              Flipkart deductions
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-2xs space-y-1">
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                              Flipkart Net Earnings
                            </span>
                            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              ₹
                              {selectedReport.financialSummary.netEarnings.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              Before custom seller costs
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1">
                            <span className="text-[11px] text-muted-foreground block">
                              Pending Settlement
                            </span>
                            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                              ₹
                              {selectedReport.financialSummary.amountPending.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              Settled: ₹
                              {selectedReport.financialSummary.amountSettled.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ingestion & Record Details */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Report Metadata & Coverage
                      </h3>
                      <div className="rounded-md border border-border bg-muted/20 p-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Unique SKUs Processed:
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {selectedReport.skuCount} SKUs
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Order Items Processed:
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {selectedReport.orderCount} Orders
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Original File Name:
                          </span>
                          <span className="font-mono text-foreground truncate max-w-[300px]">
                            {selectedReport.fileName}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">
                            Uploaded Timestamp:
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(selectedReport.uploadedAt).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>

                        {/* Raw Summary Metadata from Excel sheet */}
                        {selectedReport.summaryMetadata &&
                          Object.keys(selectedReport.summaryMetadata).length >
                            0 && (
                            <div className="pt-2 space-y-1 ">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                                Official Sheet Metadata
                              </span>
                              {Object.entries(
                                selectedReport.summaryMetadata,
                              ).map(([key, value], index) => (
                                <div
                                  key={key}
                                  className={cn(
                                    "flex justify-between py-1.5 text-[11px] px-2 border border-accent  m-0! rounded-sm",
                                    index % 2 === 0 ? "bg-muted" : "bg-card/5",
                                  )}
                                >
                                  <span className="text-muted-foreground">
                                    {key}
                                  </span>
                                  <span className="font-mono font-medium text-foreground">
                                    {String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Direct Action Hub */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Quick Actions for {selectedReport.periodLabel}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button
                          asChild
                          variant="default"
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer"
                        >
                          <Link href={`/pnl/${selectedReport._id}`}>
                            <TableIcon className="h-4 w-4" />
                            Open P&L Tables ({selectedReport.periodLabel})
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20"
                        >
                          <Link
                            href={`/analytics/actual-profit?periodFilter=${selectedReport.reportingPeriod}`}
                          >
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            Actual Profit Dashboard
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer"
                        >
                          <Link
                            href={`/analytics/compare?periodA=${selectedReport.reportingPeriod}`}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Compare with Month
                          </Link>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) =>
                            handleReprocess(selectedReport._id, e)
                          }
                          disabled={reprocessingId === selectedReport._id}
                          className="text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${reprocessingId === selectedReport._id ? "animate-spin" : ""}`}
                          />
                          Reprocess Calculation Snapshots
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(selectedReport, e)}
                          className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Report
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* Delete Confirmation Modal */}
      <DeleteReportDialog
        report={deletingReport}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
