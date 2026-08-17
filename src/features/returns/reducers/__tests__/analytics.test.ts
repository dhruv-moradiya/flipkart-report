import { ReturnRecord } from "../../types/return.types";
import { buildReturnAnalytics } from "../analytics.reducer";

/**
 * Creates a mock test dataset matching the exact 115-record Flipkart return scenario
 */
export function generateMockFlipkartDataset(): ReturnRecord[] {
  const records: ReturnRecord[] = [];

  for (let i = 0; i < 115; i++) {
    // 55 Customer Returns, 60 Courier Returns
    const returnType = i < 55 ? "customer_return" : "courier_return";

    // 106 In Transit, 9 Start
    const returnStatus = i < 106 ? "in_transit" : "start";

    // 114 Unique Orders (1 duplicate order)
    const orderId = i === 114 ? "OD100000000000000" : `OD${(100000000000000 + i).toString()}`;

    // 27 Unique SKUs
    const sku = `SKU_STYLE_${(i % 27).toString().padStart(2, "0")}`;

    // Values that sum to 15823
    const totalPrice = i === 114 ? 137.59 + (15823 - 137.59 * 115) : 137.59;

    // 42 records with comments
    const comments = i < 42 ? `Customer requested return because size did not fit for item ${i}` : null;

    records.push({
      locationId: "LOC_SURAT_395011",
      orderId,
      orderItemId: `OI_${i}`,
      returnId: `12103499490156267${i.toString().padStart(8, "0")}`,
      trackingId: `FMPC${(1000000000 + i).toString()}`,
      shipmentId: `SHP${(1000000000 + i).toString()}`,
      replacementOrderItemId: null,
      sku,
      fsn: `FSN${(i % 27).toString()}`,
      product: `Flipkart Returned Product ${sku}`,
      totalPrice: Math.round(totalPrice),
      quantity: 1,
      ffType: "NON_FBF",
      returnRequestedDate: new Date(2026, 4, 20),
      returnApprovalDate: new Date(2026, 4, 21),
      completedDate: null,
      outForDeliveryDate: null,
      returnDeliveryPromiseDate: new Date(2026, 4, 30),
      pickedUpDate: new Date(2026, 4, 22),
      shipmentType: "NORMAL",
      returnStatus,
      completionStatus: "Open",
      returnType,
      returnReason: i % 2 === 0 ? "order_cancelled" : "DAMAGED_PRODUCT",
      returnSubReason: "DAMAGED_PRODUCT_RECEIVED",
      comments,
      vendorName: "flipkartlogistics",
      locationName: "SURAT : 395011",
      flyerStatus: null,
      flyerCaptured: null,
      flyerActual: null,
      deliveryProofTime: null,
      obdEligible: null,
      obdStatus: null,
      obdRemarks: null,
      deliveryProofOtc: null,
      bagTrackingId: null,
      orderType: null,
      customerGstin: null,
      customerCompanyName: null,
      irnNumber: null,
      invoiceNumber: null,
      invoiceDate: null,
    });
  }

  return records;
}

export function runAnalyticsTests() {
  const records = generateMockFlipkartDataset();
  const analytics = buildReturnAnalytics(records);

  const assertions = [
    { name: "Total Returns = 115", passed: analytics.overview.totalReturns === 115 },
    { name: "Total Quantity = 115", passed: analytics.overview.totalQuantity === 115 },
    { name: "Unique Orders = 114", passed: analytics.overview.uniqueOrders === 114 },
    { name: "Unique SKUs = 27", passed: analytics.overview.uniqueSkus === 27 },
    { name: "Customer Returns = 55", passed: analytics.returnType.customerReturns === 55 },
    { name: "Courier Returns = 60", passed: analytics.returnType.courierReturns === 60 },
    { name: "In Transit = 106", passed: analytics.status.inTransit === 106 },
    { name: "Start = 9", passed: analytics.status.start === 9 },
    { name: "Open Returns = 115", passed: analytics.completion.openReturns === 115 },
    {
      name: "Customer Returns + Courier Returns = Total Returns",
      passed: analytics.returnType.customerReturns + analytics.returnType.courierReturns === analytics.overview.totalReturns,
    },
    {
      name: "In Transit + Start = Total Returns",
      passed: analytics.status.inTransit + analytics.status.start === analytics.overview.totalReturns,
    },
    {
      name: "Returns with Comments = 42",
      passed: analytics.comments.returnsWithComments === 42 && analytics.comments.returnsWithoutComments === 73,
    },
    {
      name: "Comments HasData is True",
      passed: analytics.comments.hasData === true,
    },
    {
      name: "Single FF Type is True (NON_FBF)",
      passed: analytics.logistics.isSingleFfType && analytics.logistics.fulfillmentType === "NON_FBF",
    },
    {
      name: "Single Location is True (SURAT : 395011)",
      passed: analytics.location.isSingleLocation,
    },
  ];

  return assertions;
}
