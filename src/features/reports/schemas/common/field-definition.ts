import { ReportType } from "../../types/report.types";

export type FieldImportance = "required" | "optional" | "informational";

export type FieldDataType = "string" | "number" | "integer" | "date" | "boolean";

export interface FieldDefinition {
  key: string;
  label: string;
  aliases: string[];
  parentAliases?: string[];
  type: FieldDataType;
  importance: FieldImportance;
  required: boolean;
  description: string;
  sourceReports: ReportType[];
}

export interface SheetSchema {
  sheetNamePattern: string[];
  displayName: string;
  required: boolean;
  fields: FieldDefinition[];
}

export interface ReportSchema {
  id: string;
  reportType: ReportType;
  version: string;
  sheets: SheetSchema[];
  fields: FieldDefinition[];
}
