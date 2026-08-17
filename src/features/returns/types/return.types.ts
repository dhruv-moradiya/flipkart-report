/**
 * Normalized Flipkart Return Record Model
 * Maps 1:1 with the 43 exact columns in the official Flipkart Returns Report
 */
export interface ReturnRecord {
  locationId: string;

  orderId: string;
  orderItemId: string;

  returnId: string;
  trackingId: string;
  shipmentId: string;
  replacementOrderItemId: string | null;

  sku: string;
  fsn: string;
  product: string;

  totalPrice: number;
  quantity: number;

  ffType: string;

  returnRequestedDate: Date | null;
  returnApprovalDate: Date | null;
  completedDate: Date | null;
  outForDeliveryDate: Date | null;
  returnDeliveryPromiseDate: Date | null;
  pickedUpDate: Date | null;

  shipmentType: string;

  returnStatus: string;
  completionStatus: string;
  returnType: string;

  returnReason: string;
  returnSubReason: string;

  comments: string | null;

  vendorName: string;
  locationName: string;

  flyerStatus: string | null;
  flyerCaptured: string | null;
  flyerActual: string | null;

  deliveryProofTime: string | null;

  obdEligible: string | null;
  obdStatus: string | null;
  obdRemarks: string | null;

  deliveryProofOtc: string | null;

  bagTrackingId: string | null;

  orderType: string | null;

  customerGstin: string | null;
  customerCompanyName: string | null;

  irnNumber: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;

  // Raw original row record for fallback inspection
  rawRecord?: Record<string, unknown>;
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheetName: string;
  records: ReturnRecord[];
  totalRows: number;
  parsedAt: string;
  errors?: string[];
}
