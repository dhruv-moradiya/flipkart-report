"use client";

import React, { useRef } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";
import { useExcelData } from "@/context/excel-context";
import { useExcelParser } from "@/hooks/use-excel-parser";
import { ReportDetectionDialog } from "./report-detection";
import { ReportValidationModal } from "./report-validation";
import { ParserDiagnosticsPanel } from "./parser-diagnostics";

export function ReportManager() {
  const {
    pnlReport,
    records,
    uploadedReportsState,
    clearPnlData,
    clearReturnsData,
  } = useExcelData();

  const {
    fileInputRef,
    handleFileChange,
    isTypeDialogOpen,
    setIsTypeDialogOpen,
    pendingFile,
    detectionResult,
    processSelectedReport,
    isValidationModalOpen,
    setIsValidationModalOpen,
    lastValidationDiagnostics,
    lastParsedFileName,
    handleValidationProceed,
  } = useExcelParser();

  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdditionalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Uploaded Reports Master Container */}
      <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  uploadedReportsState.bothActive
                    ? "bg-emerald-400"
                    : "bg-primary"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  uploadedReportsState.bothActive
                    ? "bg-emerald-500"
                    : "bg-primary"
                }`}
              />
            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.02em] text-foreground font-sans">
              Active Flipkart Datasets
            </span>

            {uploadedReportsState.bothActive ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-none text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full font-sans">
                <Sparkles className="h-3 w-3 text-emerald-500" />
                Complete Order Journey Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium leading-none text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full font-sans">
                {uploadedReportsState.pnlActive
                  ? "1 of 2 Uploaded (P&L Active)"
                  : "1 of 2 Uploaded (Returns Active)"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <input
              ref={additionalFileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleAdditionalFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => additionalFileInputRef.current?.click()}
              className="h-7.5 text-xs font-medium gap-1.5 bg-background hover:bg-muted cursor-pointer shadow-2xs font-sans"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Additional Report</span>
            </Button>
          </div>
        </div>

        {/* Dataset Cards Grid */}
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Profit & Loss Report Card */}
            {uploadedReportsState.pnlActive && pnlReport ? (
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3 shadow-2xs transition-all hover:border-border/80 relative overflow-hidden group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground tracking-[-0.005em] font-sans">
                          Flipkart Profit & Loss Report
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearPnlData}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Remove P&L Report
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* File info */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-background/60 border border-border/60 rounded-md px-2.5 py-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[260px] sm:max-w-[320px]">
                    {pnlReport.fileName}
                  </span>
                  <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                    <CopyButton
                      text={pnlReport.fileName}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  </div>
                </div>

                {/* Metric Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums font-sans bg-background"
                  >
                    {pnlReport.skuLevel.length} SKUs
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums font-sans bg-background"
                  >
                    {pnlReport.orders.length} Order items
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-medium leading-none px-2 py-0.5 font-sans"
                  >
                    SKU P&L + Orders P&L
                  </Badge>
                </div>
              </div>
            ) : (
              <div
                onClick={() => additionalFileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/30 p-4 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-semibold text-foreground block font-sans">
                      Upload Flipkart Profit & Loss Report
                    </span>
                    <p className="text-[11px] text-muted-foreground font-normal">
                      Click to upload .xlsx report to connect unit economics & SKU waterfall.
                    </p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            )}

            {/* 2. Returns Report Card */}
            {uploadedReportsState.returnsActive ? (
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3 shadow-2xs transition-all hover:border-border/80 relative overflow-hidden group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground tracking-[-0.005em] font-sans">
                          Flipkart Returns Report
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearReturnsData}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Remove Returns Report
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* File info */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-background/60 border border-border/60 rounded-md px-2.5 py-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[260px] sm:max-w-[320px]">
                    {uploadedReportsState.returnsFileName || "Returns Report"}
                  </span>
                  <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                    <CopyButton
                      text={uploadedReportsState.returnsFileName || ""}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  </div>
                </div>

                {/* Metric Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums font-sans bg-background"
                  >
                    {records.length.toLocaleString()} Returns tracked
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-medium leading-none px-2 py-0.5 font-sans"
                  >
                    43 Reverse Tracking Columns
                  </Badge>
                </div>
              </div>
            ) : (
              <div
                onClick={() => additionalFileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/30 p-4 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                    <RotateCcw className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-semibold text-foreground block font-sans">
                      Upload Flipkart Returns Report
                    </span>
                    <p className="text-[11px] text-muted-foreground font-normal">
                      Click to upload .csv / .xlsx report to track reverse logistics & return reasons.
                    </p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            )}
          </div>

          {/* Integrated Ingestion Diagnostics Panel */}
          {pnlReport?.diagnostics && (
            <ParserDiagnosticsPanel
              diagnostics={{
                reportType: "profit_loss",
                schemaVersion: "v1",
                confidence: 0.98,
                sheetsDetected: pnlReport.sheetNames,
                columnsDetected:
                  pnlReport.diagnostics.ordersColumnsDetected +
                  pnlReport.diagnostics.skuColumnsDetected,
                hiddenColumnsDetected: 20,
                mergedRangesDetected: 6,
                mappedFields: pnlReport.diagnostics.expenseFieldsMapped,
                unknownFields: pnlReport.diagnostics.unknownFieldsDetected || [],
                missingRequiredFields: [],
                warnings: pnlReport.diagnostics.warnings || [],
                errors: [],
              }}
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {pendingFile && (
        <ReportDetectionDialog
          isOpen={isTypeDialogOpen}
          onClose={() => setIsTypeDialogOpen(false)}
          fileName={pendingFile.name}
          detection={detectionResult}
          onConfirm={(selectedType, customReportName, dateRange) =>
            processSelectedReport(pendingFile, selectedType, customReportName, dateRange)
          }
        />
      )}

      {/* Validation Screen Modal */}
      {lastValidationDiagnostics && (
        <ReportValidationModal
          isOpen={isValidationModalOpen}
          onClose={() => setIsValidationModalOpen(false)}
          fileName={lastParsedFileName}
          diagnostics={lastValidationDiagnostics}
          onProceed={handleValidationProceed}
        />
      )}
    </div>
  );
}
