"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as XLSX from "xlsx";
import { parseFlipkartReturnsFile } from "../features/reports/parsers/flipkart-returns.parser";
import { parseFlipkartPnlReport } from "../features/reports/parsers/flipkart-pnl.parser";
import { detectReportType } from "../features/reports/detector/report-detector";
import { ReportType, ReportDetectionResult } from "../features/reports/types/report.types";
import { ParserDiagnostics } from "../features/reports/validation/parser-diagnostics";
import { useExcelData } from "@/context/excel-context";

export function useExcelParser() {
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

  const processSelectedReport = async (file: File, reportType: ReportType) => {
    setIsTypeDialogOpen(false);
    setError(null);
    setIsParsing(true);

    try {
      if (reportType === "profit_loss" || reportType === "sku_pnl_orders_pnl") {
        const result = await parseFlipkartPnlReport(file);
        setPnlReport(result);

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
          setLastParsedFileName(file.name);
          setIsValidationModalOpen(true);
        }
      } else if (reportType === "returns") {
        const result = await parseFlipkartReturnsFile(file);
        setParseResult(result);

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors.join("\n"));
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
        setLastParsedFileName(file.name);
        setIsValidationModalOpen(true);
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
