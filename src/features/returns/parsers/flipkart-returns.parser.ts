import { FLIPKART_FIELDS } from "../constants/flipkart-fields";
import { ReturnRecord, ParseResult } from "../types/return.types";
import { readWorkbook } from "./excel-reader";
import {
  normalizeString,
  normalizeNullableString,
  normalizeNumber,
  normalizeInteger,
} from "../utils/normalize";
import { parseFlipkartDate } from "../utils/date";

/**
 * Creates a case-insensitive, whitespace-trimmed field resolver for raw Flipkart headers
 */
function createFieldResolver(headers: string[]) {
  const normalizedHeaderMap: Record<string, string> = {};

  headers.forEach((h) => {
    // Normalization: lowercase, remove underscores/hyphens/extra spaces
    const clean = h.toLowerCase().replace(/[-_\s]+/g, "");
    normalizedHeaderMap[clean] = h;
  });

  return function getVal(row: Record<string, unknown>, standardKey: keyof typeof FLIPKART_FIELDS): unknown {
    const standardName = FLIPKART_FIELDS[standardKey];

    // 1. Direct match
    if (row[standardName] !== undefined) {
      return row[standardName];
    }

    // 2. Normalized match
    const cleanStandard = standardName.toLowerCase().replace(/[-_\s]+/g, "");
    const actualHeader = normalizedHeaderMap[cleanStandard];
    if (actualHeader && row[actualHeader] !== undefined) {
      return row[actualHeader];
    }

    return undefined;
  };
}

/**
 * Converts a raw row into a strictly normalized ReturnRecord
 */
export function normalizeFlipkartRow(
  rawRow: Record<string, unknown>,
  resolver: (row: Record<string, unknown>, key: keyof typeof FLIPKART_FIELDS) => unknown
): ReturnRecord {
  const get = (key: keyof typeof FLIPKART_FIELDS) => resolver(rawRow, key);

  return {
    locationId: normalizeString(get("locationId")),

    orderId: normalizeString(get("orderId")),
    orderItemId: normalizeString(get("orderItemId")),

    returnId: normalizeString(get("returnId")),
    trackingId: normalizeString(get("trackingId")),
    shipmentId: normalizeString(get("shipmentId")),
    replacementOrderItemId: normalizeNullableString(get("replacementOrderItemId")),

    sku: normalizeString(get("sku")),
    fsn: normalizeString(get("fsn")),
    product: normalizeString(get("product")),

    totalPrice: normalizeNumber(get("totalPrice"), 0),
    quantity: normalizeInteger(get("quantity"), 1),

    ffType: normalizeString(get("ffType")),

    returnRequestedDate: parseFlipkartDate(get("returnRequestedDate")),
    returnApprovalDate: parseFlipkartDate(get("returnApprovalDate")),
    completedDate: parseFlipkartDate(get("completedDate")),
    outForDeliveryDate: parseFlipkartDate(get("outForDeliveryDate")),
    returnDeliveryPromiseDate: parseFlipkartDate(get("returnDeliveryPromiseDate")),
    pickedUpDate: parseFlipkartDate(get("pickedUpDate")),

    shipmentType: normalizeString(get("shipmentType")),

    returnStatus: normalizeString(get("returnStatus")),
    completionStatus: normalizeString(get("completionStatus")),
    returnType: normalizeString(get("returnType")),

    returnReason: normalizeString(get("returnReason")),
    returnSubReason: normalizeString(get("returnSubReason")),

    comments: normalizeNullableString(get("comments")),

    vendorName: normalizeString(get("vendorName")),
    locationName: normalizeString(get("locationName")),

    flyerStatus: normalizeNullableString(get("flyerStatus")),
    flyerCaptured: normalizeNullableString(get("flyerCaptured")),
    flyerActual: normalizeNullableString(get("flyerActual")),

    deliveryProofTime: normalizeNullableString(get("deliveryProofTime")),

    obdEligible: normalizeNullableString(get("obdEligible")),
    obdStatus: normalizeNullableString(get("obdStatus")),
    obdRemarks: normalizeNullableString(get("obdRemarks")),

    deliveryProofOtc: normalizeNullableString(get("deliveryProofOtc")),

    bagTrackingId: normalizeNullableString(get("bagTrackingId")),

    orderType: normalizeNullableString(get("orderType")),

    customerGstin: normalizeNullableString(get("customerGstin")),
    customerCompanyName: normalizeNullableString(get("customerCompanyName")),

    irnNumber: normalizeNullableString(get("irnNumber")),
    invoiceNumber: normalizeNullableString(get("invoiceNumber")),
    invoiceDate: parseFlipkartDate(get("invoiceDate")),

    rawRecord: rawRow,
  };
}

/**
 * Parses an entire Flipkart return file into typed records
 */
export async function parseFlipkartReturnsFile(file: File, sheetIndex = 0): Promise<ParseResult> {
  const workbook = await readWorkbook(file);
  const sheetNames = workbook.sheetNames;

  if (sheetNames.length === 0) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const activeSheetName = sheetNames[sheetIndex] || sheetNames[0];
  const sheetData = workbook.sheets[activeSheetName];

  if (!sheetData || sheetData.rows.length === 0) {
    return {
      fileName: file.name,
      fileSize: file.size,
      sheetNames,
      activeSheetName,
      records: [],
      totalRows: 0,
      parsedAt: new Date().toISOString(),
    };
  }

  const resolver = createFieldResolver(sheetData.headers);
  const records = sheetData.rows.map((row) => normalizeFlipkartRow(row, resolver));

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames,
    activeSheetName,
    records,
    totalRows: records.length,
    parsedAt: new Date().toISOString(),
  };
}
