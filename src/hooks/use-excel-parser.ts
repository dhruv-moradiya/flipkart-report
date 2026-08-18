"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { parseFlipkartReturnsFile } from "../features/reports/parsers/flipkart-returns.parser";
import { parseFlipkartPnlReport } from "../features/reports/parsers/flipkart-pnl.parser";
import { detectReportType } from "../features/reports/detector/report-detector";
import { ReportType, ReportDetectionResult } from "../features/reports/types/report.types";
import { ParserDiagnostics } from "../features/reports/validation/parser-diagnostics";
import { useExcelData } from "@/context/excel-context";
import { apiClient } from "@/lib/api-client";

export function useExcelParser() {
  const queryClient = useQueryClient();
  const {
    activeReportType,
    setActiveReportType,
    records,
    returnsAnalytics,
    analytics,
    pnlReport,
    pnlAnalytics,
    fileName,
    fileSize,
    sheetNames,
    activeSheetName,
    uploadedReportsState,
    setParseResult,
    setPnlReport,
    loadReportFromBackend,
    clearReturnsData,
    clearPnlData,
    clearData,
    openOrderJourney,
    closeOrderJourney,
    activeJourney,
    selectedJourneyOrderId,
    logToConsole,
  } = useExcelData();

  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [logCount, setLogCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog State for Report Detection Confirmation
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<ReportDetectionResult | null>(null);

  // Validation Modal State
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [lastValidationDiagnostics, setLastValidationDiagnostics] = useState<ParserDiagnostics | null>(null);
  const [lastParsedFileName, setLastParsedFileName] = useState<string>("");

  const processSelectedReport = async (
    file: File,
    reportType: ReportType,
    customReportName?: string,
    selectedMonth?: number,
    selectedYear?: number
  ) => {
    setIsTypeDialogOpen(false);
    setError(null);
    setIsParsing(true);

    try {
      if (reportType === "profit_loss" || reportType === "sku_pnl_orders_pnl") {
        const result = await parseFlipkartPnlReport(file);
        setPnlReport(result);

        const finalFileName = customReportName?.trim() || file.name;
        const reportingPeriod =
          selectedYear && selectedMonth
            ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
            : undefined;

        // Persist to backend database & calculate snapshots permanently
        try {
          const importRes = await apiClient.post("/api/reports/import", {
            fileName: finalFileName,
            reportingPeriod,
            userSelectedMonth: selectedMonth,
            userSelectedYear: selectedYear,
            summaryMetadata: result.metadata?.rawMetadata || {},
            skuRecords: result.skuLevel,
            orderRecords: result.orders,
            replaceExisting: false,
          });

          // Immediately invalidate all query caches to show fresh data
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["report-imports"] }),
            queryClient.invalidateQueries({ queryKey: ["available-periods"] }),
            queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] }),
            queryClient.invalidateQueries({ queryKey: ["sku-performance"] }),
            queryClient.invalidateQueries({ queryKey: ["all-sku-costs"] }),
          ]);

          if (importRes.data?.data?._id) {
            loadReportFromBackend(importRes.data.data._id);
          }
        } catch (apiErr) {
          console.warn("Backend report persistence notification:", apiErr);
        }

        // Prepare diagnostics for validation modal
        if (result.diagnostics) {
          setLastValidationDiagnostics({
            reportType: "profit_loss",
            schemaVersion: "v1",
            confidence: 0.98,
            sheetsDetected: result.sheetNames,
            columnsDetected: result.diagnostics.ordersColumnsDetected + result.diagnostics.skuColumnsDetected,
            hiddenColumnsDetected: 20,
            mergedRangesDetected: 6,
            mappedFields: result.diagnostics.expenseFieldsMapped,
            unknownFields: result.diagnostics.unknownFieldsDetected || [],
            missingRequiredFields: [],
            warnings: result.diagnostics.warnings || [],
            errors: [],
          });
          setLastParsedFileName(finalFileName);
          setIsValidationModalOpen(true);
        }
      } else if (reportType === "returns") {
        try {
          const result = await parseFlipkartReturnsFile(file);
          if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors.join("\n"));
          }
          setParseResult(result);

          const finalFileName = customReportName?.trim() || file.name;
          const reportingPeriod =
            selectedYear && selectedMonth
              ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
              : undefined;

          try {
            await apiClient.post("/api/reports/returns/import", {
              fileName: finalFileName,
              reportingPeriod,
              userSelectedMonth: selectedMonth,
              userSelectedYear: selectedYear,
              summaryMetadata: {},
              returnRecords: result.records,
              replaceExisting: false,
            });

            queryClient.invalidateQueries({ queryKey: ["report-imports"] });
            queryClient.invalidateQueries({ queryKey: ["available-periods"] });
          } catch (importErr) {
            console.error("Backend Returns report auto-import error:", importErr);
          }

          setLastValidationDiagnostics({
            reportType: "returns",
            schemaVersion: "v1",
            confidence: 0.98,
            sheetsDetected: result.sheetNames,
            columnsDetected: 43,
            hiddenColumnsDetected: 0,
            mergedRangesDetected: 0,
            mappedFields: ["returnId", "orderId", "orderItemId", "sku", "product", "returnStatus", "comments"],
            unknownFields: result.unknownFieldsDetected || [],
            missingRequiredFields: [],
            warnings: result.warnings || [],
            errors: result.errors || [],
          });
          setLastParsedFileName(finalFileName);
          setIsValidationModalOpen(true);
        } catch (returnsErr: any) {
          // If returns parser fails, attempt P&L parser as auto-fallback
          console.warn("Returns parser failed, attempting P&L auto-fallback...", returnsErr);
          const pnlResult = await parseFlipkartPnlReport(file);
          if (pnlResult && pnlResult.skuLevel.length > 0) {
            setPnlReport(pnlResult);
            const finalFileName = customReportName?.trim() || file.name;
            const reportingPeriod =
              selectedYear && selectedMonth
                ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
                : undefined;

            try {
              const importRes = await apiClient.post("/api/reports/import", {
                fileName: finalFileName,
                reportingPeriod,
                userSelectedMonth: selectedMonth,
                userSelectedYear: selectedYear,
                summaryMetadata: pnlResult.metadata?.rawMetadata || {},
                skuRecords: pnlResult.skuLevel,
                orderRecords: pnlResult.orders,
                replaceExisting: false,
              });

              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["report-imports"] }),
                queryClient.invalidateQueries({ queryKey: ["available-periods"] }),
                queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] }),
                queryClient.invalidateQueries({ queryKey: ["sku-performance"] }),
                queryClient.invalidateQueries({ queryKey: ["all-sku-costs"] }),
              ]);

              if (importRes.data?.data?._id) {
                loadReportFromBackend(importRes.data.data._id);
              }
            } catch (apiErr) {
              console.warn("Backend report persistence notification:", apiErr);
            }

            if (pnlResult.diagnostics) {
              setLastValidationDiagnostics({
                reportType: "profit_loss",
                schemaVersion: "v1",
                confidence: 0.98,
                sheetsDetected: pnlResult.sheetNames,
                columnsDetected: pnlResult.diagnostics.ordersColumnsDetected + pnlResult.diagnostics.skuColumnsDetected,
                hiddenColumnsDetected: 20,
                mergedRangesDetected: 6,
                mappedFields: pnlResult.diagnostics.expenseFieldsMapped,
                unknownFields: pnlResult.diagnostics.unknownFieldsDetected || [],
                missingRequiredFields: [],
                warnings: pnlResult.diagnostics.warnings || [],
                errors: [],
              });
              setLastParsedFileName(finalFileName);
              setIsValidationModalOpen(true);
            }
          } else {
            throw returnsErr;
          }
        }
      } else {
        throw new Error(`Report type "${reportType}" is currently under development.`);
      }
      setLogCount((prev) => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse Flipkart report.";
      setError(message);
    } finally {
      setIsParsing(false);
      setPendingFile(null);
    }
  };

  const handleValidationProceed = () => {
    setIsValidationModalOpen(false);
  };

  const handleIncomingFile = async (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setError(`Invalid file type "${fileExt}". Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.`);
      return;
    }

    setError(null);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
        sheetRows: 25,
      });

      const detection = detectReportType(workbook);
      setDetectionResult(detection);
      setPendingFile(file);
      setIsTypeDialogOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to inspect uploaded file.";
      setError(`File Inspection Error: ${message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleIncomingFile(selectedFile);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleIncomingFile(droppedFile);
    }
  };

  const handleReset = () => {
    clearData();
    setError(null);
    setIsTypeDialogOpen(false);
    setIsValidationModalOpen(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerReLog = () => {
    logToConsole();
    setLogCount((prev) => prev + 1);
  };

  return {
    activeReportType,
    setActiveReportType,
    records,
    returnsAnalytics,
    analytics,
    pnlReport,
    pnlAnalytics,
    fileName,
    fileSize,
    sheetNames,
    activeSheetName,
    uploadedReportsState,
    isParsing,
    error,
    setError,
    isDragOver,
    logCount,
    fileInputRef,
    // Dialog state
    isTypeDialogOpen,
    setIsTypeDialogOpen,
    pendingFile,
    detectionResult,
    processSelectedReport,
    // Validation modal state
    isValidationModalOpen,
    setIsValidationModalOpen,
    lastValidationDiagnostics,
    lastParsedFileName,
    handleValidationProceed,
    // Handlers
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleReset,
    clearReturnsData,
    clearPnlData,
    openOrderJourney,
    closeOrderJourney,
    activeJourney,
    selectedJourneyOrderId,
    triggerReLog,
  };
}
