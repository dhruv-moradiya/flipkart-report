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

import { apiClient } from "@/lib/api-client";

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
  loadReturnsFromBackend: (reportIdOrPeriod?: string) => Promise<boolean>;
  activeReturnsReportId: string | null;

  // 2. Profit & Loss Report Data (Persisted in DB)
  pnlReport: PnlReport | null;
  pnlAnalytics: PnlAnalytics | null;
  setPnlReport: (report: PnlReport | null) => void;
  clearPnlData: () => void;
  loadReportFromBackend: (reportIdOrPeriod?: string) => Promise<boolean>;
  isDbLoading: boolean;
  activeReportingPeriod: string | null;
  activeReportId: string | null;

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

export function ExcelProvider({ children }: { children: React.ReactNode }) {
  const [activeReportType, setActiveReportType] = useState<
    ReportType | "journey" | null
  >(null);

  // Independent Datasets
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [pnlReport, setPnlReportState] = useState<PnlReport | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [activeReportingPeriod, setActiveReportingPeriod] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeReturnsReportId, setActiveReturnsReportId] = useState<string | null>(null);

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

  const loadReportFromBackend = useCallback(async (reportIdOrPeriod?: string): Promise<boolean> => {
    setIsDbLoading(true);
    try {
      const endpoint = reportIdOrPeriod && reportIdOrPeriod !== "latest"
        ? `/api/reports/${reportIdOrPeriod}/data`
        : `/api/reports/data`;
      const res = await apiClient.get(endpoint);
      if (res.data?.success && res.data?.data?.pnlReport) {
        const payload = res.data.data;
        setPnlReportState(payload.pnlReport);
        setPnlFileName(payload.pnlReport.fileName);
        setActiveReportType("profit_loss");
        setActiveReportingPeriod(payload.report?.reportingPeriod || null);
        setActiveReportId(payload.report?._id || null);
        setSheetNames(payload.pnlReport.sheetNames || []);
        setActiveSheetName(payload.pnlReport.skuSheetName || "SKU Level P&L");
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Backend report loading notice:", err);
      return false;
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  const loadReturnsFromBackend = useCallback(async (reportIdOrPeriod?: string): Promise<boolean> => {
    setIsDbLoading(true);
    try {
      const endpoint = reportIdOrPeriod && reportIdOrPeriod !== "latest"
        ? `/api/reports/returns/${reportIdOrPeriod}/data`
        : `/api/reports/returns/data`;
      const res = await apiClient.get(endpoint);
      if (res.data?.success && res.data?.data?.returnsReport) {
        const payload = res.data.data;
        setRecords(payload.returnsReport.records || []);
        setReturnsFileName(payload.returnsReport.fileName || null);
        setActiveReturnsReportId(payload.report?._id || null);
        setActiveReportType("returns");
        if (payload.returnsReport.sheetNames) {
          setSheetNames(payload.returnsReport.sheetNames);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Backend returns report loading notice:", err);
      return false;
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  // Hydrate from DB & URL query params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const pathname = url.pathname;
      const orderIdParam = url.searchParams.get("orderId");
      if (orderIdParam) {
        setSelectedJourneyOrderId(orderIdParam);
      }

      // If already on a specific /pnl/[id] or /table/[id] page, that page handles its own loading by params
      if (pathname.startsWith("/pnl/") || pathname.startsWith("/table/")) {
        setIsDbLoading(false);
        return;
      }

      const periodParam = url.searchParams.get("period");
      const reportIdParam = url.searchParams.get("reportId");

      if (reportIdParam || periodParam) {
        loadReportFromBackend(reportIdParam || periodParam || undefined);
        loadReturnsFromBackend(reportIdParam || periodParam || undefined);
      } else {
        loadReportFromBackend();
        loadReturnsFromBackend();
      }
    } else {
      loadReportFromBackend();
      loadReturnsFromBackend();
    }
  }, [loadReportFromBackend, loadReturnsFromBackend]);

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
    const pnlActive = Boolean(
      pnlReport &&
        ((pnlReport.skuLevel && pnlReport.skuLevel.length > 0) ||
          (pnlReport.orders && pnlReport.orders.length > 0))
    );
    const returnsActive = Boolean(records && records.length > 0);
    return {
      pnlActive,
      returnsActive,
      bothActive: pnlActive && returnsActive,
      pnlReportFileName: pnlActive ? (pnlReport?.fileName || pnlFileName || undefined) : undefined,
      returnsFileName: returnsActive ? (returnsFileName || undefined) : undefined,
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
  };

  const clearPnlData = () => {
    setPnlReportState(null);
    setPnlFileName(null);
    if (records.length > 0) {
      setActiveReportType("returns");
    } else {
      setActiveReportType(null);
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
        loadReturnsFromBackend,
        activeReturnsReportId,
        pnlReport,
        pnlAnalytics,
        setPnlReport,
        clearPnlData,
        loadReportFromBackend,
        isDbLoading,
        activeReportingPeriod,
        activeReportId,
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
