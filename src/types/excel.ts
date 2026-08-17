export interface ParsedSheet {
  name: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, unknown>[];
  fullData: Record<string, unknown>[];
}

export interface FileAnalysis {
  fileName: string;
  fileSize: number;
  formattedSize: string;
  sheetNames: string[];
  totalRows: number;
  sheets: ParsedSheet[];
  parsedAt: string;
}

export interface FlipkartReturnMetrics {
  totalReturns: number;
  totalRefundValue: number;
  customerReturns: number;
  courierReturns: number;
  statusCounts: Record<string, number>;
  topReasons: { reason: string; count: number }[];
  topSkus: { sku: string; count: number }[];
}

export interface ExcelContextType {
  fileAnalysis: FileAnalysis | null;
  setFileAnalysis: (analysis: FileAnalysis | null) => void;
  activeSheetName: string | null;
  setActiveSheetName: (sheetName: string | null) => void;
  clearData: () => void;
  logToConsole: () => void;
}
