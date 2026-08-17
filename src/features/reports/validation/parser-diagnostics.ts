import { ReportType } from "../types/report.types";

export interface ParserDiagnostics {
  reportType: ReportType;
  schemaVersion: string | null;
  confidence: number;
  sheetsDetected: string[];
  columnsDetected: number;
  hiddenColumnsDetected: number;
  mergedRangesDetected: number;
  mappedFields: string[];
  unknownFields: string[];
  missingRequiredFields: string[];
  missingOptionalFields?: string[];
  warnings: string[];
  errors: string[];
  financialValidationWarnings?: string[];
}

/**
 * Creates an empty/initial diagnostics object
 */
export function createEmptyDiagnostics(reportType: ReportType): ParserDiagnostics {
  return {
    reportType,
    schemaVersion: "v1",
    confidence: 1.0,
    sheetsDetected: [],
    columnsDetected: 0,
    hiddenColumnsDetected: 0,
    mergedRangesDetected: 0,
    mappedFields: [],
    unknownFields: [],
    missingRequiredFields: [],
    missingOptionalFields: [],
    warnings: [],
    errors: [],
    financialValidationWarnings: [],
  };
}
