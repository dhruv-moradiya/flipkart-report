/**
 * Intelligent column classification and mapping for Flipkart Reports
 */

export interface FlipkartColumnMapping {
  returnId?: string;
  trackingId?: string;
  shipmentId?: string;
  sku?: string;
  product?: string;
  status?: string;
  returnType?: string;
  returnReason?: string;
  returnSubReason?: string;
  comments?: string;
  requestedDate?: string;
  approvedDate?: string;
  pickedUpDate?: string;
  completedDate?: string;
  deliveryPromiseDate?: string;
  fsn?: string;
  orderId?: string;
  orderItemId?: string;
  replacementOrderId?: string;
  quantity?: string;
  price?: string;
  logisticsPartner?: string;
  ffType?: string;
  shipmentType?: string;
  vendor?: string;
  location?: string;
}

export function detectFlipkartColumns(headers: string[]): FlipkartColumnMapping {
  const mapping: FlipkartColumnMapping = {};

  headers.forEach((header) => {
    const h = header.toLowerCase().trim();

    if (!mapping.returnId && (/return.*id|return_id/i.test(h) || h === "id")) {
      mapping.returnId = header;
    } else if (!mapping.trackingId && /tracking.*id|tracking_id|tracking_no|tracking.*num|awb/i.test(h)) {
      mapping.trackingId = header;
    } else if (!mapping.shipmentId && /shipment.*id|shipment_id/i.test(h)) {
      mapping.shipmentId = header;
    } else if (!mapping.sku && /seller.*sku|sku/i.test(h)) {
      mapping.sku = header;
    } else if (!mapping.product && /product.*name|product.*title|item.*title|title|product/i.test(h)) {
      mapping.product = header;
    } else if (!mapping.status && /return.*status|status|state|fulfillment.*status/i.test(h)) {
      mapping.status = header;
    } else if (!mapping.returnType && /return.*type|sub_type|return_sub_type/i.test(h)) {
      mapping.returnType = header;
    } else if (!mapping.returnReason && /return.*reason|reason/i.test(h)) {
      mapping.returnReason = header;
    } else if (!mapping.returnSubReason && /^return.*sub[-_\s]*reason|^sub[-_\s]*reason/i.test(h)) {
      mapping.returnSubReason = header;
    } else if (!mapping.comments && /^comments?$|^seller.*comments?$|^customer.*comments?$/i.test(h)) {
      mapping.comments = header;
    } else if (!mapping.requestedDate && /request.*date|created.*date|return_request_date/i.test(h)) {
      mapping.requestedDate = header;
    } else if (!mapping.approvedDate && /approved.*date|approval.*date/i.test(h)) {
      mapping.approvedDate = header;
    } else if (!mapping.pickedUpDate && /picked.*date|pickup.*date/i.test(h)) {
      mapping.pickedUpDate = header;
    } else if (!mapping.completedDate && /completed.*date|delivery.*date|received.*date/i.test(h)) {
      mapping.completedDate = header;
    } else if (!mapping.deliveryPromiseDate && /promise.*date|expected.*date/i.test(h)) {
      mapping.deliveryPromiseDate = header;
    } else if (!mapping.fsn && /fsn|flipkart.*serial/i.test(h)) {
      mapping.fsn = header;
    } else if (!mapping.orderId && /order.*id|order_id/i.test(h)) {
      mapping.orderId = header;
    } else if (!mapping.orderItemId && /order.*item.*id|item.*id/i.test(h)) {
      mapping.orderItemId = header;
    } else if (!mapping.replacementOrderId && /replacement.*order/i.test(h)) {
      mapping.replacementOrderId = header;
    } else if (!mapping.quantity && /quantity|qty/i.test(h)) {
      mapping.quantity = header;
    } else if (!mapping.price && /price|amount|refund|value|return_value/i.test(h)) {
      mapping.price = header;
    } else if (!mapping.logisticsPartner && /logistics|courier|partner|carrier/i.test(h)) {
      mapping.logisticsPartner = header;
    } else if (!mapping.ffType && /ff.*type|fulfillment/i.test(h)) {
      mapping.ffType = header;
    } else if (!mapping.shipmentType && /shipment.*type/i.test(h)) {
      mapping.shipmentType = header;
    } else if (!mapping.vendor && /vendor|seller/i.test(h)) {
      mapping.vendor = header;
    } else if (!mapping.location && /location|hub|facility|warehouse/i.test(h)) {
      mapping.location = header;
    }
  });

  return mapping;
}

/**
 * Returns list of primary column names that should be visible by default
 */
export function getPrimaryVisibleColumns(headers: string[], mapping: FlipkartColumnMapping): Record<string, boolean> {
  const primaryMapped = [
    mapping.returnId,
    mapping.trackingId,
    mapping.shipmentId,
    mapping.sku,
    mapping.product,
    mapping.returnType,
    mapping.returnReason,
    mapping.comments,
    mapping.status,
    mapping.requestedDate,
    mapping.price,
  ].filter(Boolean) as string[];

  const visibility: Record<string, boolean> = {};

  headers.forEach((header) => {
    if (primaryMapped.includes(header)) {
      visibility[header] = true;
    } else {
      // If none matched, keep first 6 columns visible
      const index = headers.indexOf(header);
      visibility[header] = primaryMapped.length === 0 ? index < 6 : false;
    }
  });

  return visibility;
}
