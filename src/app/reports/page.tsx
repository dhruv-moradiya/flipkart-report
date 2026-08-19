"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReportImports,
  useDeleteReport,
  useReprocessReport,
} from "@/hooks/use-report-imports";
import { PnlReportImportItem } from "@/types/sku-cost.types";
import { DeleteReportDialog } from "@/components/reports/delete-report-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  PlusCircle,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  CreditCard,
} from "lucide-react";

type ReportTypeFilter = "ALL" | "FLIPKART_PNL" | "FLIPKART_RETURNS" | "FLIPKART_SETTLEMENTS";
type SortOption =
  | "period_desc"
  | "period_asc"
  | "upload_desc"
  | "upload_asc"
  | "rows_desc"
  | "name_asc";

export default function ReportsManagementPage() {
  const { data: reports = [], isLoading, refetch } = useReportImports();
  const deleteMutation = useDeleteReport();
  const reprocessMutation = useReprocessReport();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("period_desc");

  const [deletingReport, setDeletingReport] =
    useState<PnlReportImportItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const handleDeleteClick = (report: PnlReportImportItem) => {
    setDeletingReport(report);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReport) return;
    await deleteMutation.mutateAsync(deletingReport._id);
    setIsDeleteDialogOpen(false);
    setDeletingReport(null);
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    try {
      await reprocessMutation.mutateAsync(id);
    } finally {
      setReprocessingId(null);
    }
  };

  // Filter & Sort Reports
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    // 1. Filter by Report Type
    if (typeFilter !== "ALL") {
      result = result.filter((r) => {
        if (typeFilter === "FLIPKART_SETTLEMENTS") {
          return (
            r.reportType === "FLIPKART_SETTLEMENTS" ||
            r.fileName.toLowerCase().includes("settled") ||
            r.fileName.toLowerCase().includes("settlement")
          );
        }
        if (typeFilter === "FLIPKART_RETURNS") {
          return (
            r.reportType === "FLIPKART_RETURNS" ||
            r.fileName.toLowerCase().includes("return") ||
            (r.skuCount === 0 && (r.returnCount || 0) > 0)
          );
        }
        return (
          r.reportType === "FLIPKART_PNL" ||
          (!r.fileName.toLowerCase().includes("return") &&
            !r.fileName.toLowerCase().includes("settled") &&
            !r.fileName.toLowerCase().includes("settlement") &&
            r.skuCount > 0)
        );
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.fileName.toLowerCase().includes(q) ||
          r.periodLabel.toLowerCase().includes(q) ||
          r.reportingPeriod.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "period_desc": {
          const dateA = new Date(a.periodStart || a.uploadedAt).getTime();
          const dateB = new Date(b.periodStart || b.uploadedAt).getTime();
          return dateB - dateA;
        }
        case "period_asc": {
          const dateA = new Date(a.periodStart || a.uploadedAt).getTime();
          const dateB = new Date(b.periodStart || b.uploadedAt).getTime();
          return dateA - dateB;
        }
        case "upload_desc": {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        case "upload_asc": {
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        }
        case "rows_desc": {
          const rowsA = (a.totalRows || 0) + (a.skuCount || 0) + (a.returnCount || 0);
          const rowsB = (b.totalRows || 0) + (b.skuCount || 0) + (b.returnCount || 0);
          return rowsB - rowsA;
        }
        case "name_asc": {
          return a.fileName.localeCompare(b.fileName);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [reports, typeFilter, searchQuery, sortBy]);

  const pnlCount = reports.filter(
    (r) =>
      r.reportType === "FLIPKART_PNL" ||
      (!r.fileName.toLowerCase().includes("return") &&
        !r.fileName.toLowerCase().includes("settled") &&
        !r.fileName.toLowerCase().includes("settlement") &&
        r.skuCount > 0)
  ).length;

  const returnsCount = reports.filter(
    (r) =>
      r.reportType === "FLIPKART_RETURNS" ||
      r.fileName.toLowerCase().includes("return") ||
      (r.skuCount === 0 && (r.returnCount || 0) > 0)
  ).length;

  const settlementCount = reports.filter(
    (r) =>
      r.reportType === "FLIPKART_SETTLEMENTS" ||
      r.fileName.toLowerCase().includes("settled") ||
      r.fileName.toLowerCase().includes("settlement")
  ).length;

  return (
    <div className="min-h-svh bg-background text-foreground p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Flipkart Report Archive & Management
              </h1>
              <p className="text-xs text-muted-foreground">
                All ingested P&L, Returns, and Settled Transactions reports persisted in MongoDB with live table intelligence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm" className="text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-2xs">
            <Link href="/">
              <PlusCircle className="h-4 w-4" />
              Upload Report
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 cursor-pointer bg-background shadow-2xs"
          >
            <Link href="/analytics/actual-profit">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Profit Dashboard
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 px-2 text-xs bg-background cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Reports Table & Controls Card */}
      <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden">
        {/* Controls & Filter Bar */}
        <div className="p-4 border-b border-border space-y-3 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/80 w-fit flex-wrap">
              <Button
                variant={typeFilter === "ALL" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter("ALL")}
                className="h-7 px-3 text-xs font-medium cursor-pointer rounded-lg"
              >
                All Reports
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] font-mono">
                  {reports.length}
                </Badge>
              </Button>

              <Button
                variant={typeFilter === "FLIPKART_PNL" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter("FLIPKART_PNL")}
                className="h-7 px-3 text-xs font-medium cursor-pointer rounded-lg"
              >
                P&L Reports
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] font-mono">
                  {pnlCount}
                </Badge>
              </Button>

              <Button
                variant={typeFilter === "FLIPKART_RETURNS" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter("FLIPKART_RETURNS")}
                className="h-7 px-3 text-xs font-medium cursor-pointer rounded-lg"
              >
                Returns Reports
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] font-mono">
                  {returnsCount}
                </Badge>
              </Button>

              <Button
                variant={typeFilter === "FLIPKART_SETTLEMENTS" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter("FLIPKART_SETTLEMENTS")}
                className="h-7 px-3 text-xs font-medium cursor-pointer rounded-lg"
              >
                Settlements
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] font-mono">
                  {settlementCount}
                </Badge>
              </Button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden md:inline">Sort:</span>
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as SortOption)}
              >
                <SelectTrigger className="h-8 text-xs w-[190px] font-medium bg-background border-border shadow-2xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="period_desc">Period (Newest First)</SelectItem>
                  <SelectItem value="period_asc">Period (Oldest First)</SelectItem>
                  <SelectItem value="upload_desc">Upload Date (Newest)</SelectItem>
                  <SelectItem value="upload_asc">Upload Date (Oldest)</SelectItem>
                  <SelectItem value="rows_desc">Rows Count (Highest)</SelectItem>
                  <SelectItem value="name_asc">File Name (A – Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by file name, period label, or period code (e.g. August 2026, 2026-08)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background border-border rounded-xl shadow-2xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading report archive from database...</span>
            </div>
          ) : filteredAndSortedReports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-foreground">
                  {searchQuery || typeFilter !== "ALL"
                    ? "No Matching Reports Found"
                    : "No Reports Imported Yet"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || typeFilter !== "ALL"
                    ? "Try adjusting your search terms or filter selection."
                    : "Upload your official Flipkart P&L (.xlsx) or Returns (.csv/.xlsx) reports to begin."}
                </p>
              </div>
              {(searchQuery || typeFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("ALL");
                  }}
                  className="text-xs cursor-pointer"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="text-xs w-full min-w-[960px]">
                <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                  <TableRow>
                    <TableHead className="py-3 pl-4 w-[210px]">
                      Reporting Period
                    </TableHead>
                    <TableHead className="py-3 w-[140px]">Report Type</TableHead>
                    <TableHead className="py-3 min-w-[180px]">File Name</TableHead>
                    <TableHead className="py-3 text-center w-[140px]">
                      SKUs / Orders / Units
                    </TableHead>
                    <TableHead className="py-3 text-center w-[120px]">Uploaded Date</TableHead>
                    <TableHead className="py-3 text-center w-[110px]">Status</TableHead>
                    <TableHead className="py-3 pr-4 text-right w-[260px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReports.map((report: PnlReportImportItem) => {
                    const isSettlement =
                      report.reportType === "FLIPKART_SETTLEMENTS" ||
                      report.fileName.toLowerCase().includes("settled") ||
                      report.fileName.toLowerCase().includes("settlement");

                    const isReturns =
                      !isSettlement &&
                      (report.reportType === "FLIPKART_RETURNS" ||
                        report.fileName.toLowerCase().includes("return") ||
                        (report.skuCount === 0 && (report.returnCount || 0) > 0));

                    return (
                      <TableRow
                        key={report._id}
                        className="hover:bg-muted/30 transition-colors border-b border-border/60"
                      >
                        {/* Period */}
                        <TableCell className="py-3.5 pl-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <div className="space-y-0.5">
                              <span className="font-medium text-foreground block">
                                {report.periodLabel}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0 h-4 text-muted-foreground bg-muted/60"
                              >
                                {report.reportingPeriod}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell className="py-3.5">
                          <Badge
                            variant="outline"
                            className={
                              isSettlement
                                ? "text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 px-2 py-0.5"
                                : isReturns
                                ? "text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 px-2 py-0.5"
                                : "text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 px-2 py-0.5"
                            }
                          >
                            {isSettlement
                              ? "FLIPKART_SETTLEMENTS"
                              : isReturns
                              ? "FLIPKART_RETURNS"
                              : "FLIPKART_PNL"}
                          </Badge>
                        </TableCell>

                        {/* File Name */}
                        <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[220px] block" title={report.fileName}>
                            {report.fileName}
                          </span>
                        </TableCell>

                        {/* Rows / SKUs */}
                        <TableCell className="py-3.5 text-center font-mono font-medium">
                          {isSettlement ? (
                            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5">
                              {(report.settlementCount || report.orderCount || report.validRows || 0).toLocaleString()} Settled Orders
                            </Badge>
                          ) : isReturns ? (
                            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5">
                              {(report.returnCount || report.validRows || 0).toLocaleString()} Returns
                            </Badge>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-foreground block font-bold">
                                {report.skuCount} SKUs
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {report.orderCount} Orders
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Upload Date */}
                        <TableCell className="py-3.5 text-center font-mono text-[11px] text-muted-foreground">
                          {new Date(report.uploadedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 gap-1 inline-flex items-center"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            PROCESSED
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {isSettlement ? (
                              <>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 min-w-[95px] text-[11px] bg-background hover:bg-muted font-medium text-foreground cursor-pointer gap-1.5 shadow-2xs shrink-0"
                                >
                                  <Link href={`/settlements/${report._id}`}>
                                    <CreditCard className="h-3 w-3 text-emerald-500 shrink-0" />
                                    <span>Open Table</span>
                                  </Link>
                                </Button>

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 min-w-[70px] text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer shrink-0 font-medium gap-1 shadow-2xs"
                                  title="View Settlements Analytics"
                                >
                                  <Link href="/analytics/settlements">
                                    <CreditCard className="h-3 w-3" />
                                    <span>Analytics</span>
                                  </Link>
                                </Button>
                              </>
                            ) : isReturns ? (
                              <>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 min-w-[95px] text-[11px] bg-background hover:bg-muted font-medium text-foreground cursor-pointer gap-1.5 shadow-2xs shrink-0"
                                >
                                  <Link href={`/table/${report._id}`}>
                                    <RotateCcw className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span>Open Table</span>
                                  </Link>
                                </Button>

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 min-w-[70px] text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer shrink-0 font-medium gap-1 shadow-2xs"
                                  title="View Returns Analytics"
                                >
                                  <Link href="/analytics/returns">
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Analytics</span>
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 min-w-[95px] text-[11px] bg-background hover:bg-muted font-medium text-foreground cursor-pointer gap-1.5 shadow-2xs shrink-0"
                                >
                                  <Link href={`/pnl/${report._id}`}>
                                    <FileSpreadsheet className="h-3 w-3 text-primary shrink-0" />
                                    <span>Open Table</span>
                                  </Link>
                                </Button>

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 min-w-[70px] text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer shrink-0 font-medium gap-1 shadow-2xs"
                                  title="View Actual Profit Intelligence"
                                >
                                  <Link
                                    href={`/analytics/actual-profit?reportId=${report._id}`}
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Profit</span>
                                  </Link>
                                </Button>
                              </>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleReprocess(report._id)}
                              disabled={reprocessingId === report._id}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 shadow-2xs"
                              title="Reprocess Snapshots"
                            >
                              <RefreshCw
                                className={`h-3 w-3 ${reprocessingId === report._id ? "animate-spin" : ""}`}
                              />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(report)}
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer shrink-0"
                              title="Delete Report"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Footer Summary */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="font-mono text-foreground">{filteredAndSortedReports.length}</strong> of{" "}
              <strong className="font-mono text-foreground">{reports.length}</strong> imported reports
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
            <span>P&L: {pnlCount}</span>
            <span>•</span>
            <span>Returns: {returnsCount}</span>
            <span>•</span>
            <span>Settlements: {settlementCount}</span>
          </div>
        </CardFooter>
      </Card>

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
