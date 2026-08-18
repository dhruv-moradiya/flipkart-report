"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useReportImports,
  useDeleteReport,
  useReprocessReport,
} from "@/hooks/use-report-imports";
import { PnlReportImportItem } from "@/types/sku-cost.types";
import { DeleteReportDialog } from "@/components/reports/delete-report-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink,
} from "lucide-react";

export default function ReportsManagementPage() {
  const { data: reports = [], isLoading, refetch } = useReportImports();
  const deleteMutation = useDeleteReport();
  const reprocessMutation = useReprocessReport();

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

  return (
    <div className="min-h-svh bg-background text-foreground p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Persistent P&L Report Archive & Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every uploaded Flipkart P&L report is stored permanently as a
            historical reporting import.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="text-xs gap-1.5 cursor-pointer">
            <Link href="/">
              <PlusCircle className="h-4 w-4" />
              Upload Monthly P&L
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs cursor-pointer"
          >
            <Link href="/analytics/actual-profit">Profit Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Reports Table Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">
              Uploaded Monthly Imports
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical normalized data stored in backend database.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {reports.length} Reports
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Loading report archive...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                No P&L reports imported yet.
              </p>
              <Button asChild size="sm" className="text-xs">
                <Link href="/">Upload First Report</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40 font-semibold">
                  <TableRow>
                    <TableHead className="py-2.5 pl-4">
                      Reporting Period
                    </TableHead>
                    <TableHead className="py-2.5">Report Type</TableHead>
                    <TableHead className="py-2.5">File Name</TableHead>
                    <TableHead className="py-2.5 text-center">
                      SKUs / Orders
                    </TableHead>
                    <TableHead className="py-2.5">Uploaded Date</TableHead>
                    <TableHead className="py-2.5 text-center">Status</TableHead>
                    <TableHead className="py-2.5 pr-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: PnlReportImportItem) => (
                    <TableRow
                      key={report._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Period */}
                      <TableCell className="py-3 pl-4 font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span>{report.periodLabel}</span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {report.reportingPeriod}
                        </span>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            report.reportType === "FLIPKART_RETURNS"
                              ? "text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          }
                        >
                          {report.reportType === "FLIPKART_RETURNS"
                            ? "Flipkart Returns"
                            : "Flipkart P&L"}
                        </Badge>
                      </TableCell>

                      {/* File Name */}
                      <TableCell className="py-3 font-mono text-[11px] max-w-[220px] truncate text-muted-foreground">
                        {report.fileName}
                      </TableCell>

                      {/* Rows */}
                      <TableCell className="py-3 text-center font-mono font-medium">
                        {report.reportType === "FLIPKART_RETURNS"
                          ? `${report.returnCount || report.validRows || 0} Returns`
                          : `${report.skuCount} SKUs / ${report.orderCount} Orders`}
                      </TableCell>

                      {/* Upload Date */}
                      <TableCell className="py-3 text-muted-foreground">
                        {new Date(report.uploadedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-center">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Processed
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {report.reportType === "FLIPKART_RETURNS" ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] bg-background text-foreground hover:text-primary cursor-pointer gap-1"
                            >
                              <Link href={`/table?reportId=${report._id}`}>
                                <FileSpreadsheet className="h-3 w-3" />
                                Returns Table
                              </Link>
                            </Button>
                          ) : (
                            <>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] bg-background text-foreground hover:text-primary cursor-pointer gap-1"
                              >
                                <Link href={`/pnl/${report._id}`}>
                                  <FileSpreadsheet className="h-3 w-3" />
                                  P&L Tables
                                </Link>
                              </Button>

                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-primary hover:text-primary cursor-pointer"
                              >
                                <Link
                                  href={`/analytics/actual-profit?periodFilter=${report.reportingPeriod}`}
                                >
                                  Profit <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                              </Button>
                            </>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocess(report._id)}
                            disabled={reprocessingId === report._id}
                            className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                            title="Reprocess Profit Snapshots"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${reprocessingId === report._id ? "animate-spin" : ""}`}
                            />
                            Reprocess
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(report)}
                            className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
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
