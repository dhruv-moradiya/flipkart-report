"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  ReturnRecord,
  ParseResult,
} from "../features/returns/types/return.types";
import { ReturnAnalytics } from "../features/returns/types/analytics.types";
import { buildReturnAnalytics } from "../features/returns/reducers/analytics.reducer";
import { PnlReport } from "../features/pnl/types/pnl.types";
import { PnlAnalytics } from "../features/pnl/types/pnl-analytics.types";
import { buildPnlAnalytics } from "../features/pnl/reducers/pnl-analytics.reducer";
import {
  ReportType,
  UploadedReportsState,
} from "../features/reports/types/report.types";
import { OrderJourney } from "../features/reports/types/journey.types";
import { buildOrderJourney } from "../features/reports/relations/order-journey.builder";

export interface ExcelContextState {
  // Active Report View Mode
  activeReportType: ReportType | "journey" | null;
  setActiveReportType: (type: ReportType | "journey" | null) => void;

  // 1. Returns Report Data
  records: ReturnRecord[];
  returnsAnalytics: ReturnAnalytics | null;
  analytics: ReturnAnalytics | null; // Backwards compatible alias
  setParseResult: (result: ParseResult | null) => void;
  clearReturnsData: () => void;

  // 2. Profit & Loss Report Data
  pnlReport: PnlReport | null;
  pnlAnalytics: PnlAnalytics | null;
  setPnlReport: (report: PnlReport | null) => void;
  clearPnlData: () => void;

  // 3. Order Journey State & Action
  selectedJourneyOrderId: string | null;
  activeJourney: OrderJourney | null;
  openOrderJourney: (orderId: string) => void;
  closeOrderJourney: () => void;

  // File Metadata
  fileName: string | null;
  fileSize: number;
  sheetNames: string[];
  activeSheetName: string | null;
  uploadedReportsState: UploadedReportsState;

  // Global Actions
  clearData: () => void;
  logToConsole: () => void;
}

const ExcelContext = createContext<ExcelContextState | undefined>(undefined);

const STORAGE_KEY_RETURNS = "flipkart_reports_normalized_records";
const STORAGE_KEY_PNL = "flipkart_reports_pnl_data";
const META_KEY = "flipkart_reports_meta";

export function ExcelProvider({ children }: { children: React.ReactNode }) {
  const [activeReportType, setActiveReportType] = useState<
    ReportType | "journey" | null
  >(null);

  // Independent Datasets
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [pnlReport, setPnlReportState] = useState<PnlReport | null>(null);

  // File Names
  const [returnsFileName, setReturnsFileName] = useState<string | null>(null);
  const [pnlFileName, setPnlFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string | null>(null);

  // Order Journey State
  const [selectedJourneyOrderId, setSelectedJourneyOrderId] = useState<
    string | null
  >(null);

  // Hydrate from SessionStorage and URL query params
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const orderIdParam = url.searchParams.get("orderId");
        if (orderIdParam) {
          setSelectedJourneyOrderId(orderIdParam);
        }
      }

      const savedMeta = sessionStorage.getItem(META_KEY);
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        setActiveReportType(
          meta.activeReportType || (meta.hasPnl ? "profit_loss" : "returns"),
        );
        setReturnsFileName(meta.returnsFileName || null);
        setPnlFileName(meta.pnlFileName || null);
        setFileSize(meta.fileSize || 0);
        setSheetNames(meta.sheetNames || []);
        setActiveSheetName(meta.activeSheetName || null);
      }

      const savedPnl = sessionStorage.getItem(STORAGE_KEY_PNL);
      if (savedPnl) {
        setPnlReportState(JSON.parse(savedPnl));
      }

      const savedRecords = sessionStorage.getItem(STORAGE_KEY_RETURNS);
      if (savedRecords) {
        const parsedRecords: ReturnRecord[] = JSON.parse(savedRecords);
        const hydrated = parsedRecords.map((r) => ({
          ...r,
          returnRequestedDate: r.returnRequestedDate
            ? new Date(r.returnRequestedDate)
            : null,
          returnApprovalDate: r.returnApprovalDate
            ? new Date(r.returnApprovalDate)
            : null,
          completedDate: r.completedDate ? new Date(r.completedDate) : null,
          outForDeliveryDate: r.outForDeliveryDate
            ? new Date(r.outForDeliveryDate)
            : null,
          returnDeliveryPromiseDate: r.returnDeliveryPromiseDate
            ? new Date(r.returnDeliveryPromiseDate)
            : null,
          pickedUpDate: r.pickedUpDate ? new Date(r.pickedUpDate) : null,
          invoiceDate: r.invoiceDate ? new Date(r.invoiceDate) : null,
        }));
        setRecords(hydrated);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Listen to browser Back/Forward (popstate) for Order Journey query param
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const orderIdParam = url.searchParams.get("orderId");
      setSelectedJourneyOrderId(orderIdParam || null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Compute Returns domain analytics
  const returnsAnalytics = useMemo<ReturnAnalytics | null>(() => {
    if (records.length === 0) return null;
    return buildReturnAnalytics(records);
  }, [records]);

  // Compute P&L domain analytics
  const pnlAnalytics = useMemo<PnlAnalytics | null>(() => {
    if (!pnlReport) return null;
    return buildPnlAnalytics(pnlReport);
  }, [pnlReport]);

  // Compute Active Order Journey
  const activeJourney = useMemo<OrderJourney | null>(() => {
    if (!selectedJourneyOrderId) return null;
    return buildOrderJourney(selectedJourneyOrderId, {
      pnlReport,
      returnsRecords: records,
      skusRanking: pnlAnalytics?.skus || null,
    });
  }, [selectedJourneyOrderId, pnlReport, records, pnlAnalytics]);

  const openOrderJourney = useCallback((orderId: string) => {
    setSelectedJourneyOrderId(orderId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("orderId") !== orderId) {
        url.searchParams.set("orderId", orderId);
        window.history.pushState(
          {},
          "",
          url.pathname + (url.search ? url.search : ""),
        );
      }
    }
  }, []);

  const closeOrderJourney = useCallback(() => {
    setSelectedJourneyOrderId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("orderId")) {
        url.searchParams.delete("orderId");
        window.history.pushState(
          {},
          "",
          url.pathname + (url.search ? url.search : ""),
        );
      }
    }
  }, []);

  const uploadedReportsState: UploadedReportsState = useMemo(() => {
    const pnlActive = Boolean(pnlReport);
    const returnsActive = records.length > 0;
    return {
      pnlActive,
      returnsActive,
      bothActive: pnlActive && returnsActive,
      pnlReportFileName: pnlReport?.fileName || pnlFileName || undefined,
      returnsFileName: returnsFileName || undefined,
    };
  }, [pnlReport, records, pnlFileName, returnsFileName]);

  const setParseResult = (result: ParseResult | null) => {
    if (result) {
      setRecords(result.records);
      setReturnsFileName(result.fileName);
      setFileSize(result.fileSize);
      setSheetNames(result.sheetNames);
      setActiveSheetName(result.activeSheetName);
      setActiveReportType("returns");

      try {
        sessionStorage.setItem(
          META_KEY,
          JSON.stringify({
            activeReportType: "returns",
            returnsFileName: result.fileName,
            pnlFileName,
            hasPnl: Boolean(pnlReport),
            hasReturns: true,
            fileSize: result.fileSize,
            sheetNames: result.sheetNames,
            activeSheetName: result.activeSheetName,
          }),
        );
        sessionStorage.setItem(
          STORAGE_KEY_RETURNS,
          JSON.stringify(result.records),
        );
      } catch {
        // Safe storage quota fallback
      }
    } else {
      clearReturnsData();
    }
  };

  const setPnlReport = (report: PnlReport | null) => {
    if (report) {
      setPnlReportState(report);
      setPnlFileName(report.fileName);
      setFileSize(report.fileSize);
      setSheetNames(report.sheetNames);
      setActiveSheetName(report.skuSheetName);
      setActiveReportType("profit_loss");

      try {
        sessionStorage.setItem(
          META_KEY,
          JSON.stringify({
            activeReportType: "profit_loss",
            pnlFileName: report.fileName,
            returnsFileName,
            hasPnl: true,
            hasReturns: records.length > 0,
            fileSize: report.fileSize,
            sheetNames: report.sheetNames,
            activeSheetName: report.skuSheetName,
          }),
        );
        sessionStorage.setItem(STORAGE_KEY_PNL, JSON.stringify(report));
      } catch {
        // Safe storage quota fallback
      }
    } else {
      clearPnlData();
    }
  };

  const clearReturnsData = () => {
    setRecords([]);
    setReturnsFileName(null);
    if (pnlReport) {
      setActiveReportType("profit_loss");
    } else {
      setActiveReportType(null);
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY_RETURNS);
    } catch {
      // Ignore
    }
  };

  const clearPnlData = () => {
    setPnlReportState(null);
    setPnlFileName(null);
    if (records.length > 0) {
      setActiveReportType("returns");
    } else {
      setActiveReportType(null);
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY_PNL);
    } catch {
      // Ignore
    }
  };

  const clearData = () => {
    clearReturnsData();
    clearPnlData();
    setFileSize(0);
    setSheetNames([]);
    setActiveSheetName(null);
    setActiveReportType(null);
    setSelectedJourneyOrderId(null);
    try {
      sessionStorage.removeItem(META_KEY);
      sessionStorage.removeItem(STORAGE_KEY_RETURNS);
      sessionStorage.removeItem(STORAGE_KEY_PNL);
    } catch {
      // Ignore
    }
  };

  const logToConsole = () => {
    console.group("📊 [Flipkart Unified Analytics Engine]");
    if (pnlReport && pnlAnalytics) {
      console.log("📈 Flipkart Profit & Loss Report:", pnlAnalytics);
    }
    if (records.length > 0 && returnsAnalytics) {
      console.log("🚚 Flipkart Returns Report:", returnsAnalytics);
    }
    console.log("🔗 Uploaded Reports State:", uploadedReportsState);
    console.groupEnd();
  };

  const fileName = pnlReport?.fileName || returnsFileName || null;

  return (
    <ExcelContext.Provider
      value={{
        activeReportType,
        setActiveReportType,
        records,
        returnsAnalytics,
        analytics: returnsAnalytics,
        setParseResult,
        clearReturnsData,
        pnlReport,
        pnlAnalytics,
        setPnlReport,
        clearPnlData,
        selectedJourneyOrderId,
        activeJourney,
        openOrderJourney,
        closeOrderJourney,
        fileName,
        fileSize,
        sheetNames,
        activeSheetName,
        uploadedReportsState,
        clearData,
        logToConsole,
      }}
    >
      {children}
    </ExcelContext.Provider>
  );
}

export function useExcelData(): ExcelContextState {
  const context = useContext(ExcelContext);
  if (!context) {
    throw new Error("useExcelData must be used within an ExcelProvider");
  }
  return context;
}
