"use client";

import React from "react";
import { UploadCloud, AlertCircle, X, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useExcelParser } from "@/hooks/use-excel-parser";
import { ReportTypeDialog } from "./report-type-dialog";
import { ReportValidationModal } from "@/features/reports/components/report-validation";

export function FileDropzone() {
  const {
    isParsing,
    error,
    setError,
    isDragOver,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
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

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
        }`}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
          id="excel-file-input"
        />

        {isParsing ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Inspecting Flipkart report structure & multi-row headers...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 py-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border border-border shadow-xs">
              <UploadCloud className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag & drop your Flipkart report here, or{" "}
                <span className="text-primary underline underline-offset-4">
                  browse
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports Flipkart Returns reports and SKU-level P&L + Orders P&L workbooks (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive whitespace-pre-line">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-xs leading-relaxed">{error}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/20 cursor-pointer"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingFile && (
        <ReportTypeDialog
          isOpen={isTypeDialogOpen}
          onClose={() => setIsTypeDialogOpen(false)}
          fileName={pendingFile.name}
          detection={detectionResult}
          onConfirm={(selectedType, customReportName, selectedMonth, selectedYear) =>
            processSelectedReport(
              pendingFile,
              selectedType,
              customReportName,
              selectedMonth,
              selectedYear
            )
          }
        />
      )}

      {/* Post-Ingestion Validation Screen */}
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
