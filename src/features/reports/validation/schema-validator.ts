import { ColumnMappingResult } from "../excel/column-matcher";
import { FieldDefinition } from "../schemas/common/field-definition";

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * Validates mapped columns against canonical schema field definitions
 */
export function validateColumnMapping(mapping: ColumnMappingResult): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  // Check required fields
  if (mapping.missingRequiredFields.length > 0) {
    mapping.missingRequiredFields.forEach((field) => {
      missingRequired.push(field.label);
      errors.push(`Missing required field: "${field.label}" (${field.key})`);
    });
  }

  // Check optional fields
  if (mapping.missingOptionalFields.length > 0) {
    mapping.missingOptionalFields.forEach((field) => {
      missingOptional.push(field.label);
      warnings.push(`Optional field not found in this report: "${field.label}"`);
    });
  }

  // Check unknown columns
  if (mapping.unknownColumns.length > 0) {
    warnings.push(
      `${mapping.unknownColumns.length} unknown column(s) detected: ${mapping.unknownColumns
        .map((c) => `"${c.header}"`)
        .slice(0, 5)
        .join(", ")}${mapping.unknownColumns.length > 5 ? "..." : ""}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingOptional,
  };
}
