import * as XLSX from "xlsx";
import { ReturnRecord, ParseResult } from "../models/returns.models";
import { resolveWorksheetHeaders } from "../excel/header-resolver";
import { matchColumnsToSchema, createRowAccessor } from "../excel/column-matcher";
import { RETURNS_V1_FIELDS } from "../schemas/flipkart/versions/returns.v1";
import { validateColumnMapping } from "../validation/schema-validator";
import { getNumericValue } from "../excel/value-parser";

/**
 * Parses an entire Flipkart Returns file into typed records using matrix ingestion
 */
export async function parseFlipkartReturnsFile(file: File, sheetIndex = 0): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellDates: true,
    raw: true,
  });

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  // Pick first sheet or sheet named Returns/Sheet1
  let activeSheetName = sheetNames[sheetIndex] || sheetNames[0];
  const returnsNamedSheet = sheetNames.find(
    (s) => s.toLowerCase().includes("return") || s.toLowerCase().includes("sheet1")
  );
  if (returnsNamedSheet) {
    activeSheetName = returnsNamedSheet;
  }

  const ws = workbook.Sheets[activeSheetName];
  if (!ws) {
    throw new Error(`Worksheet "${activeSheetName}" could not be loaded.`);
  }

  // 1. Resolve multi-row / single-row headers and merged ranges
  const headerMatrix = resolveWorksheetHeaders(ws, 1);
  if (headerMatrix.dataRows.length === 0) {
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

  // 2. Semantic column matching against canonical schema
  const mapping = matchColumnsToSchema(headerMatrix.columns, RETURNS_V1_FIELDS, headerMatrix.dataRows);
  const validation = validateColumnMapping(mapping);
  const accessor = createRowAccessor(mapping, RETURNS_V1_FIELDS);

  // 3. Normalize rows
  const records: ReturnRecord[] = [];

  headerMatrix.dataRows.forEach((row) => {
    const returnId = accessor.getString(row, "returnId").value || "";
    const orderId = accessor.getString(row, "orderId").value || "";
    const orderItemId = accessor.getString(row, "orderItemId").value || "";

    // Skip completely empty rows
    if (!returnId && !orderId && !orderItemId) return;

    const locationId = accessor.getString(row, "locationId").value || "";
    const trackingId = accessor.getString(row, "trackingId").value || "";
    const shipmentId = accessor.getString(row, "shipmentId").value || "";
    const replacementOrderItemId = accessor.getString(row, "replacementOrderItemId").value || null;

    const sku = accessor.getString(row, "sku").value || "";
    const fsn = accessor.getString(row, "fsn").value || "";
    const product = accessor.getString(row, "product").value || "";

    const totalPrice = getNumericValue(accessor.getNumber(row, "totalPrice"), 0);
    const quantity = getNumericValue(accessor.getInteger(row, "quantity"), 1);
    const ffType = accessor.getString(row, "ffType").value || "";

    const returnRequestedDate = accessor.getDate(row, "returnRequestedDate").value || null;
    const returnApprovalDate = accessor.getDate(row, "returnApprovalDate").value || null;
    const completedDate = accessor.getDate(row, "completedDate").value || null;
    const outForDeliveryDate = accessor.getDate(row, "outForDeliveryDate").value || null;
    const returnDeliveryPromiseDate = accessor.getDate(row, "returnDeliveryPromiseDate").value || null;
    const pickedUpDate = accessor.getDate(row, "pickedUpDate").value || null;

    const shipmentType = accessor.getString(row, "shipmentType").value || "Forward";
    const returnStatus = accessor.getString(row, "returnStatus").value || "in_transit";
    const completionStatus = accessor.getString(row, "completionStatus").value || "";
    const returnType = accessor.getString(row, "returnType").value || "customer_return";

    const returnReason = accessor.getString(row, "returnReason").value || "";
    const returnSubReason = accessor.getString(row, "returnSubReason").value || "";

    // Comments strictly preserved
    const rawComments = accessor.getString(row, "comments").value;
    const comments = rawComments && rawComments.trim() ? rawComments.trim() : null;

    const vendorName = accessor.getString(row, "vendorName").value || "";
    const locationName = accessor.getString(row, "locationName").value || "";

    const flyerStatus = accessor.getString(row, "flyerStatus").value || null;
    const flyerCaptured = accessor.getString(row, "flyerCaptured").value || null;
    const flyerActual = accessor.getString(row, "flyerActual").value || null;

    const deliveryProofTime = accessor.getString(row, "deliveryProofTime").value || null;
    const obdEligible = accessor.getString(row, "obdEligible").value || null;
    const obdStatus = accessor.getString(row, "obdStatus").value || null;
    const obdRemarks = accessor.getString(row, "obdRemarks").value || null;

    const deliveryProofOtc = accessor.getString(row, "deliveryProofOtc").value || null;
    const bagTrackingId = accessor.getString(row, "bagTrackingId").value || null;

    const orderType = accessor.getString(row, "orderType").value || null;
    const customerGstin = accessor.getString(row, "customerGstin").value || null;
    const customerCompanyName = accessor.getString(row, "customerCompanyName").value || null;

    const irnNumber = accessor.getString(row, "irnNumber").value || null;
    const invoiceNumber = accessor.getString(row, "invoiceNumber").value || null;
    const invoiceDate = accessor.getDate(row, "invoiceDate").value || null;

    const returnResult = accessor.getString(row, "returnResult").value || null;
    const returnCompletionType = accessor.getString(row, "returnCompletionType").value || null;
    const finalCondition = accessor.getString(row, "finalCondition").value || null;
    const returnCompletionBreach = accessor.getString(row, "returnCompletionBreach").value || null;
    const returnCancellationDate = accessor.getDate(row, "returnCancellationDate").value || null;
    const returnCancellationReason = accessor.getString(row, "returnCancellationReason").value || null;

    const rawRecord = accessor.getRawRowMap(row);
    const unknownFields = accessor.getUnknownValues(row);

    records.push({
      locationId,
      orderId,
      orderItemId,
      returnId,
      trackingId,
      shipmentId,
      replacementOrderItemId,
      sku,
      fsn,
      product,
      totalPrice,
      quantity,
      ffType,
      returnRequestedDate,
      returnApprovalDate,
      completedDate,
      outForDeliveryDate,
      returnDeliveryPromiseDate,
      pickedUpDate,
      shipmentType,
      returnStatus,
      completionStatus,
      returnType,
      returnReason,
      returnSubReason,
      comments,
      vendorName,
      locationName,
      flyerStatus,
      flyerCaptured,
      flyerActual,
      deliveryProofTime,
      obdEligible,
      obdStatus,
      obdRemarks,
      deliveryProofOtc,
      bagTrackingId,
      orderType,
      customerGstin,
      customerCompanyName,
      irnNumber,
      invoiceNumber,
      invoiceDate,
      returnResult,
      returnCompletionType,
      finalCondition,
      returnCompletionBreach,
      returnCancellationDate,
      returnCancellationReason,
      rawRecord,
      unknownFields,
    });
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames,
    activeSheetName,
    records,
    totalRows: records.length,
    parsedAt: new Date().toISOString(),
    warnings: validation.warnings,
    errors: validation.errors,
    unknownFieldsDetected: mapping.unknownColumns.map((c) => c.header),
  };
}
