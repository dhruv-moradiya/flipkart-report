/**
 * Exact 43 columns in the official Flipkart Returns Report
 */
export const FLIPKART_FIELDS = {
  locationId: "Location ID",
  orderId: "Order ID",
  orderItemId: "Order Item ID",
  returnId: "Return ID",
  trackingId: "Tracking ID",
  shipmentId: "Shipment ID",
  replacementOrderItemId: "Replacement Order Item ID",

  sku: "SKU",
  fsn: "FSN",
  product: "Product",

  totalPrice: "Total Price",
  quantity: "Quantity",

  ffType: "FF Type",

  returnRequestedDate: "Return Requested Date",
  returnApprovalDate: "Return Approval Date",
  completedDate: "Completed Date",
  outForDeliveryDate: "Out For Delivery Date",
  returnDeliveryPromiseDate: "Return Delivery Promise Date",
  pickedUpDate: "Picked Up Date",

  shipmentType: "Shipment Type",

  returnStatus: "Return Status",
  completionStatus: "Completion Status",
  returnType: "Return Type",

  returnReason: "Return Reason",
  returnSubReason: "Return Sub-reason",

  comments: "Comments",

  vendorName: "Vendor Name",
  locationName: "Location Name",

  flyerStatus: "Flyer Status",
  flyerCaptured: "Flyer Captured",
  flyerActual: "Flyer Actual",

  deliveryProofTime: "Delivery Proof Time",

  obdEligible: "OBD Eligible",
  obdStatus: "OBD Status",
  obdRemarks: "OBD Remarks",

  deliveryProofOtc: "Delivery Proof OTC",

  bagTrackingId: "Bag Tracking ID",

  orderType: "Order Type",

  customerGstin: "Customer GSTIN",
  customerCompanyName: "Customer Company Name",

  irnNumber: "IRN Number",
  invoiceNumber: "Invoice Number",
  invoiceDate: "Invoice Date",
} as const;

export type FlipkartFieldKey = keyof typeof FLIPKART_FIELDS;

/**
 * Strict source of truth mapping for domain analytics calculation
 */
export const ANALYTIC_SOURCES = {
  totalReturns: "Return ID",

  customerReturns: {
    field: "Return Type",
    value: "customer_return",
  },

  courierReturns: {
    field: "Return Type",
    value: "courier_return",
  },

  inTransit: {
    field: "Return Status",
    value: "in_transit",
  },

  start: {
    field: "Return Status",
    value: "start",
  },

  completionStatus: "Completion Status",

  returnReasons: "Return Reason",
  returnSubReasons: "Return Sub-reason",

  totalValue: "Total Price",
  quantity: "Quantity",

  uniqueOrders: "Order ID",
  uniqueSkus: "SKU",

  timeline: "Return Requested Date",

  vendors: "Vendor Name",
  locations: "Location Name",
} as const;
