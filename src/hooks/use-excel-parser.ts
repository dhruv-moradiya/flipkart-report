"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as XLSX from "xlsx";
import { parseFlipkartReturnsFile } from "../features/returns/parsers/flipkart-returns.parser";
import { parseFlipkartPnlReport } from "../features/pnl/parsers/flipkart-pnl.parser";
import { detectReportType } from "../features/reports/utils/report-detector";
import { ReportType, WorkbookDetectionResult } from "../features/reports/types/report.types";
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

  // Modal State for Report Type Confirmation
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<WorkbookDetectionResult | null>(null);

  const processSelectedReport = async (file: File, reportType: ReportType) => {
    setIsTypeDialogOpen(false);
    setError(null);
    setIsParsing(true);

    try {
      if (reportType === "profit_loss" || reportType === "sku_pnl_orders_pnl") {
        const result = await parseFlipkartPnlReport(file);
        setPnlReport(result);
      } else if (reportType === "returns") {
        const result = await parseFlipkartReturnsFile(file);
        setParseResult(result);
      } else {
        throw new Error("This report type is currently under development.");
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
