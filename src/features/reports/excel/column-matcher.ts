import { ResolvedColumn, cleanHeaderString } from "./header-resolver";
import { FieldDefinition } from "../schemas/common/field-definition";
import { normalizeAlias } from "../schemas/flipkart/aliases";
import {
  parseFinancialNumber,
  parseInteger,
  parseString,
  ParsedValue,
  createParsedValue,
} from "./value-parser";
import { parseDate } from "./date-parser";

export interface ParsedUnknownColumn {
  index: number;
  excelLetter: string;
  header: string;
  parentHeader: string | null;
  childHeader: string | null;
  sampleValues: unknown[];
  hidden: boolean;
}

export interface ColumnMappingResult {
  fieldToColumn: Map<string, ResolvedColumn>;
  columnToField: Map<number, FieldDefinition>;
  mappedFieldKeys: Set<string>;
  missingRequiredFields: FieldDefinition[];
  missingOptionalFields: FieldDefinition[];
  unknownColumns: ParsedUnknownColumn[];
  totalColumns: number;
  hiddenColumnsCount: number;
  mergedColumnsCount: number;
}

/**
 * Matches resolved Excel columns against canonical field definitions
 */
export function matchColumnsToSchema(
  columns: ResolvedColumn[],
  schemaFields: FieldDefinition[],
  dataSampleRows: unknown[][] = []
): ColumnMappingResult {
  const fieldToColumn = new Map<string, ResolvedColumn>();
  const columnToField = new Map<number, FieldDefinition>();
  const mappedFieldKeys = new Set<string>();

  // Build lookup index of cleaned variations for each schema field
  const aliasToField = new Map<string, { field: FieldDefinition; priority: number }>();

  schemaFields.forEach((field) => {
    // Priority 1: Key exact
    aliasToField.set(normalizeAlias(field.key), { field, priority: 1 });
    aliasToField.set(normalizeAlias(field.label), { field, priority: 1 });

    // Priority 2: Parent + Child combinations
    if (field.parentAliases) {
      field.parentAliases.forEach((parent) => {
        field.aliases.forEach((child) => {
          aliasToField.set(normalizeAlias(`${parent} > ${child}`), { field, priority: 2 });
          aliasToField.set(normalizeAlias(`${parent} / ${child}`), { field, priority: 2 });
          aliasToField.set(normalizeAlias(`${parent} ${child}`), { field, priority: 2 });
        });
      });
    }

    // Priority 3: Direct child aliases
    field.aliases.forEach((alias) => {
      if (!aliasToField.has(normalizeAlias(alias))) {
        aliasToField.set(normalizeAlias(alias), { field, priority: 3 });
      }
    });
  });

  // Track matched column indices
  const matchedColIndices = new Set<number>();

  // Pass 1: Try exact & parent+child fullHeader matches
  columns.forEach((col) => {
    const cleanFull = normalizeAlias(col.fullHeader);
    const match = aliasToField.get(cleanFull);
    if (match && !fieldToColumn.has(match.field.key)) {
      fieldToColumn.set(match.field.key, col);
      columnToField.set(col.index, match.field);
      mappedFieldKeys.add(match.field.key);
      matchedColIndices.add(col.index);
    }
  });

  // Pass 2: Try childHeader matches for remaining columns
  columns.forEach((col) => {
    if (matchedColIndices.has(col.index)) return;

    if (col.childHeader) {
      const cleanChild = normalizeAlias(col.childHeader);
      const match = aliasToField.get(cleanChild);
      if (match && !fieldToColumn.has(match.field.key)) {
        fieldToColumn.set(match.field.key, col);
        columnToField.set(col.index, match.field);
        mappedFieldKeys.add(match.field.key);
        matchedColIndices.add(col.index);
      }
    }
  });

  // Pass 3: Try parentHeader matches for single-row headers
  columns.forEach((col) => {
    if (matchedColIndices.has(col.index)) return;

    if (col.parentHeader && !col.childHeader) {
      const cleanParent = normalizeAlias(col.parentHeader);
      const match = aliasToField.get(cleanParent);
      if (match && !fieldToColumn.has(match.field.key)) {
        fieldToColumn.set(match.field.key, col);
        columnToField.set(col.index, match.field);
        mappedFieldKeys.add(match.field.key);
        matchedColIndices.add(col.index);
      }
    }
  });

  // Find missing required and optional fields
  const missingRequiredFields: FieldDefinition[] = [];
  const missingOptionalFields: FieldDefinition[] = [];

  schemaFields.forEach((field) => {
    if (!mappedFieldKeys.has(field.key)) {
      if (field.required || field.importance === "required") {
        missingRequiredFields.push(field);
      } else {
        missingOptionalFields.push(field);
      }
    }
  });

  // Collect unknown columns
  const unknownColumns: ParsedUnknownColumn[] = [];
  let hiddenCount = 0;
  let mergedCount = 0;

  columns.forEach((col) => {
    if (col.hidden) hiddenCount++;
    if (col.parentHeader && col.childHeader) mergedCount++;

    if (!matchedColIndices.has(col.index)) {
      // Collect up to 3 non-empty sample values from data rows
      const samples: unknown[] = [];
      for (const row of dataSampleRows) {
        if (row && row[col.index] !== undefined && row[col.index] !== null && row[col.index] !== "") {
          samples.push(row[col.index]);
          if (samples.length >= 3) break;
        }
      }

      // Check if column has any meaningful header or values
      const hasContent = col.fullHeader || samples.length > 0;
      if (hasContent && !col.fullHeader.startsWith("Column_")) {
        unknownColumns.push({
          index: col.index,
          excelLetter: col.excelLetter,
          header: col.fullHeader,
          parentHeader: col.parentHeader,
          childHeader: col.childHeader,
          sampleValues: samples,
          hidden: col.hidden,
        });
      }
    }
  });

  return {
    fieldToColumn,
    columnToField,
    mappedFieldKeys,
    missingRequiredFields,
    missingOptionalFields,
    unknownColumns,
    totalColumns: columns.length,
    hiddenColumnsCount: hiddenCount,
    mergedColumnsCount: mergedCount,
  };
}

/**
 * Creates a fast domain row accessor
 */
export function createRowAccessor(
  mapping: ColumnMappingResult,
  schemaFields: FieldDefinition[]
) {
  const colIndexMap = new Map<string, number>();
  const fieldTypeMap = new Map<string, FieldDefinition>();

  schemaFields.forEach((field) => {
    fieldTypeMap.set(field.key, field);
    const col = mapping.fieldToColumn.get(field.key);
    if (col) {
      colIndexMap.set(field.key, col.index);
    }
  });

  return {
    getString: (row: unknown[], fieldKey: string): ParsedValue<string> => {
      const idx = colIndexMap.get(fieldKey);
      if (idx === undefined || idx >= row.length) {
        return createParsedValue<string>(null, "unmapped");
      }
      return parseString(row[idx]);
    },

    getNumber: (row: unknown[], fieldKey: string): ParsedValue<number> => {
      const idx = colIndexMap.get(fieldKey);
      if (idx === undefined || idx >= row.length) {
        return createParsedValue<number>(null, "unmapped");
      }
      return parseFinancialNumber(row[idx]);
    },

    getInteger: (row: unknown[], fieldKey: string): ParsedValue<number> => {
      const idx = colIndexMap.get(fieldKey);
      if (idx === undefined || idx >= row.length) {
        return createParsedValue<number>(null, "unmapped");
      }
      return parseInteger(row[idx]);
    },

    getDate: (row: unknown[], fieldKey: string): ParsedValue<Date> => {
      const idx = colIndexMap.get(fieldKey);
      if (idx === undefined || idx >= row.length) {
        return createParsedValue<Date>(null, "unmapped");
      }
      return parseDate(row[idx]);
    },

    getRawRowMap: (row: unknown[]): Record<string, unknown> => {
      const rawMap: Record<string, unknown> = {};
      mapping.columnToField.forEach((field, colIdx) => {
        if (colIdx < row.length) {
          rawMap[field.key] = row[colIdx];
        }
      });
      return rawMap;
    },

    getUnknownValues: (row: unknown[]): Record<string, unknown> => {
      const unknownMap: Record<string, unknown> = {};
      mapping.unknownColumns.forEach((uCol) => {
        if (uCol.index < row.length && row[uCol.index] !== null && row[uCol.index] !== undefined && row[uCol.index] !== "") {
          unknownMap[uCol.header] = row[uCol.index];
        }
      });
      return unknownMap;
    },
  };
}
