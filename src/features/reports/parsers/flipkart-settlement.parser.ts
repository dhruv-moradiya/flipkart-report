import * as XLSX from "xlsx";
import {
  SettlementOrderRecord,
  SettlementSummaryMetrics,
  SettlementGstRecord,
  SettlementAdsRecord,
  SettlementReportData,
} from "../types/report.types";

function cleanHeader(val: unknown): string {
  return String(val || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-_\s():/\\.]+/g, "");
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDateVal(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    // Excel date serial
    const parsed = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  const str = String(val).trim();
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime())) return directDate;

  // DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/**
 * Parses the "Summary of report" sheet
 */
export function parseSettlementSummary(sheet: XLSX.WorkSheet | undefined): SettlementSummaryMetrics {
  const defaultSummary: SettlementSummaryMetrics = {
    saleOrdersCount: 0,
    returnsCount: 0,
    ordersSettlement: 0,
    protectionFundClaim: 0,
    mpFeeRebate: 0,
    servicesFees: 0,
    taxSettlement: 0,
    netBankSettlement: 0,
    inputGstTcsCredits: 0,
    incomeTaxCredits: 0,
    totalRealizableAmount: 0,
  };

  if (!sheet) return defaultSummary;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const rawRows: Record<string, any>[] = [];

  rows.forEach((row) => {
    if (!Array.isArray(row) || row.length === 0) return;
    const lineText = row.map((c) => String(c || "").trim()).filter(Boolean).join(" ");
    if (!lineText) return;

    rawRows.push({ raw: row });

    const key = cleanHeader(row[0] || row[1] || "");
    const val = parseNumber(row[row.length - 1] || row[2] || row[1]);

    if (key.includes("netbanksettlement") || key.includes("banksettlement")) {
      defaultSummary.netBankSettlement = val || defaultSummary.netBankSettlement;
    } else if (key.includes("inputgst") || key.includes("tcscredit") || key.includes("gsttcs")) {
      defaultSummary.inputGstTcsCredits = val || defaultSummary.inputGstTcsCredits;
    } else if (key.includes("incometax") || key.includes("tdscredit") || key.includes("tds")) {
      defaultSummary.incomeTaxCredits = val || defaultSummary.incomeTaxCredits;
    } else if (key.includes("totalrealizable") || key.includes("realizableamount")) {
      defaultSummary.totalRealizableAmount = val || defaultSummary.totalRealizableAmount;
    } else if (key.includes("protectionfund") || key.includes("spf")) {
      defaultSummary.protectionFundClaim = val || defaultSummary.protectionFundClaim;
    } else if (key.includes("mpfeerebate") || key.includes("feerebate")) {
      defaultSummary.mpFeeRebate = val || defaultSummary.mpFeeRebate;
    } else if (key.includes("servicesfee") || key.includes("servicefee")) {
      defaultSummary.servicesFees = val || defaultSummary.servicesFees;
    } else if (key.includes("taxsettlement")) {
      defaultSummary.taxSettlement = val || defaultSummary.taxSettlement;
    } else if (key.includes("saleorders") || key.includes("salesorders")) {
      defaultSummary.saleOrdersCount = Math.round(val) || defaultSummary.saleOrdersCount;
    } else if (key.includes("return") && !key.includes("rebate")) {
      defaultSummary.returnsCount = Math.round(val) || defaultSummary.returnsCount;
    } else if (key === "orders" || key.includes("orderssettlement")) {
      defaultSummary.ordersSettlement = val || defaultSummary.ordersSettlement;
    }
  });

  defaultSummary.rawSummaryRows = rawRows;

  // Fallback calculations if total realizable is 0
  if (defaultSummary.totalRealizableAmount === 0 && defaultSummary.netBankSettlement !== 0) {
    defaultSummary.totalRealizableAmount =
      defaultSummary.netBankSettlement +
      defaultSummary.inputGstTcsCredits +
      defaultSummary.incomeTaxCredits;
  }

  return defaultSummary;
}

/**
 * Parses the "Orders" sheet of Flipkart Settlement report or single-sheet CSV
 */
export function parseSettlementOrders(sheet: XLSX.WorkSheet | undefined): SettlementOrderRecord[] {
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (matrix.length === 0) return [];

  // Find the header row (can be at row 0, 1, 2, 3, or row 50+ in combined Report Help CSVs)
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(100, matrix.length); r++) {
    const rowClean = (matrix[r] || []).map(cleanHeader);
    const hasOrderIdentifier = rowClean.some((h) => h === "orderid" || h.includes("orderitemid") || h === "sellersku");
    const hasSettlementIdentifier = rowClean.some(
      (h) =>
        h.includes("banksettlement") ||
        h.includes("settlementvalue") ||
        h.includes("neftid") ||
        h.includes("nefttype") ||
        h.includes("inputgst")
    );

    if (hasOrderIdentifier && hasSettlementIdentifier) {
      headerRowIndex = r;
      break;
    }
  }

  // Fallback: search for any row having "orderid" and "sellersku"
  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(100, matrix.length); r++) {
      const rowClean = (matrix[r] || []).map(cleanHeader);
      if (rowClean.some((h) => h.includes("orderid")) && rowClean.some((h) => h.includes("sellersku") || h.includes("neft"))) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) return [];

  const rawHeaders = (matrix[headerRowIndex] || []).map((h) => String(h || "").trim());
  const cleanHeaders = rawHeaders.map(cleanHeader);

  const getColIndex = (pred: (h: string) => boolean) => cleanHeaders.findIndex(pred);

  const idxNeftId = getColIndex((h) => h === "neftid" || h.includes("neftid"));
  const idxNeftType = getColIndex((h) => h.includes("nefttype"));
  const idxPaymentDate = getColIndex((h) => h.includes("paymentdate"));
  const idxBankSettlement = getColIndex((h) => h.includes("banksettlement") || h.includes("settlementvalue"));
  const idxInputGstTcs = getColIndex((h) => h.includes("inputgst") || h.includes("tcscredit") || h.includes("gsttcs"));
  const idxIncomeTax = getColIndex((h) => h.includes("incometax") || h.includes("tdscredit"));

  const idxOrderId = getColIndex((h) => h === "orderid" || (h.includes("order") && h.includes("id") && !h.includes("item")));
  const idxOrderItemId = getColIndex((h) => h.includes("orderitemid") || h.includes("itemid"));
  const idxSaleAmount = getColIndex((h) => h.includes("saleamount") || h === "sales");
  const idxTotalOffer = getColIndex((h) => h.includes("totaloffer") || h.includes("offeramount"));
  const idxMyShare = getColIndex((h) => h.includes("myshare"));
  const idxCustomerAddons = getColIndex((h) => h.includes("customeraddon"));
  const idxMarketplaceFee = getColIndex((h) => h.includes("marketplacefee") || h.includes("marketplacefees"));
  const idxTaxes = getColIndex((h) => h === "taxes" || h.startsWith("taxes") || h === "tax");
  const idxOfferAdjustments = getColIndex((h) => h.includes("offeradjustment"));
  const idxProtectionFund = getColIndex((h) => h.includes("protectionfund") || h.includes("spf"));
  const idxRefund = getColIndex((h) => h.includes("refund"));

  const idxTier = getColIndex((h) => h === "tier");
  const idxCommissionRate = getColIndex((h) => h.includes("commissionrate"));
  const idxCommission = getColIndex((h) => h === "commission" || (h.startsWith("commission") && !h.includes("rate")));
  const idxFixedFee = getColIndex((h) => h.includes("fixedfee"));
  const idxCollectionFee = getColIndex((h) => h.includes("collectionfee"));
  const idxPickPackFee = getColIndex((h) => h.includes("pickandpack") || h.includes("pickpack"));
  const idxShippingFee = getColIndex((h) => (h.includes("shippingfee") || h === "shipping") && !h.includes("reverse"));
  const idxReverseShippingFee = getColIndex((h) => h.includes("reverseshipping"));
  const idxTcs = getColIndex((h) => h === "tcs" || h.startsWith("tcs"));
  const idxTds = getColIndex((h) => h === "tds" || h.startsWith("tds"));
  const idxGstOnMpFees = getColIndex((h) => h.includes("gstonmp") || h.includes("gstmarketplace"));

  const idxDeadWeight = getColIndex((h) => h.includes("deadweight"));
  const idxDimensions = getColIndex((h) => h.includes("dimension") || h.includes("lengthbreadthheight") || h.includes("length*breadth"));
  const idxVolumetricWeight = getColIndex((h) => h.includes("volumetric"));
  const idxWeightSlab = getColIndex((h) => h.includes("weightslab") || h.includes("chargeablewt") || h.includes("chargeableweight"));
  const idxShippingZone = getColIndex((h) => h.includes("shippingzone") || h === "zone");

  const idxOrderDate = getColIndex((h) => h.includes("orderdate"));
  const idxDispatchDate = getColIndex((h) => h.includes("dispatchdate"));
  const idxFulfilmentType = getColIndex((h) => h.includes("fulfilment") || h.includes("fulfillment"));
  const idxSellerSku = getColIndex((h) => h.includes("sellersku") || h === "sku");
  const idxQuantity = getColIndex((h) => h.includes("quantity") || h === "qty");
  const idxProductSubCategory = getColIndex((h) => h.includes("productsubcategory") || h.includes("subcategory"));
  const idxAdditionalInfo = getColIndex((h) => h.includes("additionalinformation") || h.includes("additionalinfo"));
  const idxReturnType = getColIndex((h) => h.includes("returntype"));
  const idxShopsyOrder = getColIndex((h) => h.includes("shopsy"));
  const idxItemReturnStatus = getColIndex((h) => h.includes("returnstatus") || h.includes("itemreturn"));
  const idxInvoiceId = getColIndex((h) => h.includes("invoiceid") || h.includes("invoicenumber") || h.includes("invoiceno"));
  const idxInvoiceDate = getColIndex((h) => h.includes("invoicedate"));

  const records: SettlementOrderRecord[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const orderId = idxOrderId >= 0 ? String(row[idxOrderId] || "").trim() : "";
    const orderItemId = idxOrderItemId >= 0 ? String(row[idxOrderItemId] || "").trim() : "";
    const sellerSku = idxSellerSku >= 0 ? String(row[idxSellerSku] || "").trim() : "";
    const neftId = idxNeftId >= 0 ? String(row[idxNeftId] || "").trim() : "";

    // Skip empty summary / footer / header rows without order identifiers
    if (!orderId && !orderItemId && !sellerSku && !neftId) continue;
    // Skip if row is another sub-header row like "Total (Rs.)"
    if (orderId.toLowerCase().includes("total") || sellerSku.toLowerCase().includes("total")) continue;

    const record: SettlementOrderRecord = {
      neftId: neftId || undefined,
      neftType: idxNeftType >= 0 ? String(row[idxNeftType] || "").trim() : undefined,
      paymentDate: idxPaymentDate >= 0 ? parseDateVal(row[idxPaymentDate]) : null,
      bankSettlementValue: idxBankSettlement >= 0 ? parseNumber(row[idxBankSettlement]) : 0,
      inputGstTcsCredits: idxInputGstTcs >= 0 ? parseNumber(row[idxInputGstTcs]) : 0,
      incomeTaxCredits: idxIncomeTax >= 0 ? parseNumber(row[idxIncomeTax]) : 0,

      orderId: orderId || `ORD_${r}`,
      orderItemId: orderItemId || `ITEM_${r}`,
      saleAmount: idxSaleAmount >= 0 ? parseNumber(row[idxSaleAmount]) : 0,
      totalOfferAmount: idxTotalOffer >= 0 ? parseNumber(row[idxTotalOffer]) : 0,
      myShare: idxMyShare >= 0 ? parseNumber(row[idxMyShare]) : 0,
      customerAddonsAmount: idxCustomerAddons >= 0 ? parseNumber(row[idxCustomerAddons]) : 0,
      marketplaceFee: idxMarketplaceFee >= 0 ? parseNumber(row[idxMarketplaceFee]) : 0,
      taxes: idxTaxes >= 0 ? parseNumber(row[idxTaxes]) : 0,
      offerAdjustments: idxOfferAdjustments >= 0 ? parseNumber(row[idxOfferAdjustments]) : 0,
      protectionFund: idxProtectionFund >= 0 ? parseNumber(row[idxProtectionFund]) : 0,
      refund: idxRefund >= 0 ? parseNumber(row[idxRefund]) : 0,

      tier: idxTier >= 0 ? String(row[idxTier] || "").trim() : undefined,
      commissionRate: idxCommissionRate >= 0 ? parseNumber(row[idxCommissionRate]) : undefined,
      commission: idxCommission >= 0 ? parseNumber(row[idxCommission]) : 0,
      fixedFee: idxFixedFee >= 0 ? parseNumber(row[idxFixedFee]) : 0,
      collectionFee: idxCollectionFee >= 0 ? parseNumber(row[idxCollectionFee]) : 0,
      pickAndPackFee: idxPickPackFee >= 0 ? parseNumber(row[idxPickPackFee]) : 0,
      shippingFee: idxShippingFee >= 0 ? parseNumber(row[idxShippingFee]) : 0,
      reverseShippingFee: idxReverseShippingFee >= 0 ? parseNumber(row[idxReverseShippingFee]) : 0,

      tcs: idxTcs >= 0 ? parseNumber(row[idxTcs]) : 0,
      tds: idxTds >= 0 ? parseNumber(row[idxTds]) : 0,
      gstOnMpFees: idxGstOnMpFees >= 0 ? parseNumber(row[idxGstOnMpFees]) : 0,

      deadWeight: idxDeadWeight >= 0 ? parseNumber(row[idxDeadWeight]) : undefined,
      dimensions: idxDimensions >= 0 ? String(row[idxDimensions] || "").trim() : undefined,
      volumetricWeight: idxVolumetricWeight >= 0 ? parseNumber(row[idxVolumetricWeight]) : undefined,
      chargeableWeightSlab: idxWeightSlab >= 0 ? String(row[idxWeightSlab] || "").trim() : undefined,
      shippingZone: idxShippingZone >= 0 ? String(row[idxShippingZone] || "").trim() : undefined,

      orderDate: idxOrderDate >= 0 ? parseDateVal(row[idxOrderDate]) : null,
      dispatchDate: idxDispatchDate >= 0 ? parseDateVal(row[idxDispatchDate]) : null,
      fulfilmentType: idxFulfilmentType >= 0 ? String(row[idxFulfilmentType] || "").trim() : undefined,
      sellerSku: sellerSku || "UNKNOWN_SKU",
      quantity: idxQuantity >= 0 ? Math.max(1, Math.round(parseNumber(row[idxQuantity]))) : 1,
      productSubCategory: idxProductSubCategory >= 0 ? String(row[idxProductSubCategory] || "").trim() : undefined,
      additionalInformation: idxAdditionalInfo >= 0 ? String(row[idxAdditionalInfo] || "").trim() : undefined,
      returnType: idxReturnType >= 0 ? String(row[idxReturnType] || "").trim() : undefined,
      shopsyOrder: idxShopsyOrder >= 0 ? String(row[idxShopsyOrder] || "").trim() : undefined,
      itemReturnStatus: idxItemReturnStatus >= 0 ? String(row[idxItemReturnStatus] || "").trim() : undefined,
      invoiceId: idxInvoiceId >= 0 ? String(row[idxInvoiceId] || "").trim() : undefined,
      invoiceDate: idxInvoiceDate >= 0 ? parseDateVal(row[idxInvoiceDate]) : null,
    };

    records.push(record);
  }

  return records;
}

/**
 * Parses the "GST_Details" sheet
 */
export function parseSettlementGst(sheet: XLSX.WorkSheet | undefined): SettlementGstRecord[] {
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (matrix.length === 0) return [];

  const cleanHeaders = (matrix[0] || []).map(cleanHeader);
  const getColIndex = (pred: (h: string) => boolean) => cleanHeaders.findIndex(pred);

  const idxServiceType = getColIndex((h) => h.includes("servicetype"));
  const idxNeftId = getColIndex((h) => h.includes("neftid"));
  const idxReferenceId = getColIndex((h) => h.includes("orderitemid") || h.includes("referenceid") || h.includes("listingid"));
  const idxRecallId = getColIndex((h) => h.includes("recallid"));
  const idxWarehouseState = getColIndex((h) => h.includes("warehousestate") || h.includes("statecode"));
  const idxFeeName = getColIndex((h) => h.includes("feename"));
  const idxFeeAmount = getColIndex((h) => h === "feeamount");
  const idxFeeWaiver = getColIndex((h) => h.includes("feewaiver"));
  const idxCgstRate = getColIndex((h) => h.includes("cgstrate"));
  const idxSgstRate = getColIndex((h) => h.includes("sgstrate") || h.includes("utgstrate"));
  const idxIgstRate = getColIndex((h) => h.includes("igstrate"));
  const idxCgstAmount = getColIndex((h) => h.includes("cgstamount"));
  const idxSgstAmount = getColIndex((h) => h.includes("sgstamount") || h.includes("utgstamount"));
  const idxIgstAmount = getColIndex((h) => h.includes("igstamount"));
  const idxTotalGst = getColIndex((h) => h.includes("totalgstonfees") || h.includes("totalgst"));

  const records: SettlementGstRecord[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const feeName = idxFeeName >= 0 ? String(row[idxFeeName] || "").trim() : "";
    if (!feeName) continue;

    records.push({
      serviceType: idxServiceType >= 0 ? String(row[idxServiceType] || "").trim() : undefined,
      neftId: idxNeftId >= 0 ? String(row[idxNeftId] || "").trim() : undefined,
      referenceId: idxReferenceId >= 0 ? String(row[idxReferenceId] || "").trim() : undefined,
      recallId: idxRecallId >= 0 ? String(row[idxRecallId] || "").trim() : undefined,
      warehouseStateCode: idxWarehouseState >= 0 ? String(row[idxWarehouseState] || "").trim() : undefined,
      feeName,
      feeAmount: idxFeeAmount >= 0 ? parseNumber(row[idxFeeAmount]) : 0,
      feeWaiver: idxFeeWaiver >= 0 ? parseNumber(row[idxFeeWaiver]) : 0,
      cgstRate: idxCgstRate >= 0 ? parseNumber(row[idxCgstRate]) : 0,
      sgstRate: idxSgstRate >= 0 ? parseNumber(row[idxSgstRate]) : 0,
      igstRate: idxIgstRate >= 0 ? parseNumber(row[idxIgstRate]) : 0,
      cgstAmount: idxCgstAmount >= 0 ? parseNumber(row[idxCgstAmount]) : 0,
      sgstAmount: idxSgstAmount >= 0 ? parseNumber(row[idxSgstAmount]) : 0,
      igstAmount: idxIgstAmount >= 0 ? parseNumber(row[idxIgstAmount]) : 0,
      totalGst: idxTotalGst >= 0 ? parseNumber(row[idxTotalGst]) : 0,
    });
  }

  return records;
}

/**
 * Parses the "Ads" sheet
 */
export function parseSettlementAds(sheet: XLSX.WorkSheet | undefined): SettlementAdsRecord[] {
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (matrix.length === 0) return [];

  const cleanHeaders = (matrix[0] || []).map(cleanHeader);
  const getColIndex = (pred: (h: string) => boolean) => cleanHeaders.findIndex(pred);

  const idxNeftId = getColIndex((h) => h.includes("neftid"));
  const idxPaymentDate = getColIndex((h) => h.includes("paymentdate"));
  const idxSettlementValue = getColIndex((h) => h.includes("settlementvalue") || h.includes("banksettlement"));
  const idxType = getColIndex((h) => h === "type");
  const idxCampaignId = getColIndex((h) => h.includes("campaign") || h.includes("transactionid"));
  const idxWalletRedeem = getColIndex((h) => h.includes("walletredeem") && !h.includes("reversal"));
  const idxWalletRedeemReversal = getColIndex((h) => h.includes("walletredeemreversal") || h.includes("reversal"));
  const idxWalletTopup = getColIndex((h) => h.includes("wallettopup"));
  const idxWalletRefund = getColIndex((h) => h.includes("walletrefund"));
  const idxGstOnAds = getColIndex((h) => h.includes("gstonads") || h.includes("gst"));

  const records: SettlementAdsRecord[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const type = idxType >= 0 ? String(row[idxType] || "").trim() : "";
    const campaignId = idxCampaignId >= 0 ? String(row[idxCampaignId] || "").trim() : "";
    const val = idxSettlementValue >= 0 ? parseNumber(row[idxSettlementValue]) : 0;

    if (!type && !campaignId && val === 0) continue;

    records.push({
      neftId: idxNeftId >= 0 ? String(row[idxNeftId] || "").trim() : undefined,
      paymentDate: idxPaymentDate >= 0 ? parseDateVal(row[idxPaymentDate]) : null,
      type,
      campaignTransactionId: campaignId,
      walletRedeem: idxWalletRedeem >= 0 ? parseNumber(row[idxWalletRedeem]) : 0,
      walletRedeemReversal: idxWalletRedeemReversal >= 0 ? parseNumber(row[idxWalletRedeemReversal]) : 0,
      walletTopup: idxWalletTopup >= 0 ? parseNumber(row[idxWalletTopup]) : 0,
      walletRefund: idxWalletRefund >= 0 ? parseNumber(row[idxWalletRefund]) : 0,
      gstOnAdsFees: idxGstOnAds >= 0 ? parseNumber(row[idxGstOnAds]) : 0,
      settlementValue: val,
    });
  }

  return records;
}

/**
 * Main parser entrypoint for Flipkart Settlement report files
 */
export async function parseFlipkartSettlementReport(file: File): Promise<SettlementReportData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

  const sheetNames = workbook.SheetNames || [];

  const findSheet = (keywords: string[]) => {
    const matched = sheetNames.find((name) => {
      const c = cleanHeader(name);
      return keywords.some((k) => c.includes(k));
    });
    return matched ? workbook.Sheets[matched] : undefined;
  };

  const summarySheet = findSheet(["summaryofreport", "summary"]);
  const ordersSheet = findSheet(["orders", "settledorders"]);
  const gstSheet = findSheet(["gstdetails", "gst"]);
  const adsSheet = findSheet(["ads", "advertising"]);

  const summary = parseSettlementSummary(summarySheet);
  let orders = parseSettlementOrders(ordersSheet);
  const gstDetails = parseSettlementGst(gstSheet);
  const ads = parseSettlementAds(adsSheet);

  // If ordersSheet is not found by name or yielded 0 orders, search all sheets (e.g. CSV with Sheet1)
  if (orders.length === 0) {
    for (const name of sheetNames) {
      const candidate = workbook.Sheets[name];
      if (!candidate) continue;
      const parsed = parseSettlementOrders(candidate);
      if (parsed.length > 0) {
        orders = parsed;
        break;
      }
    }
  }

  // Update order count and return counts if available from orders
  if (orders.length > 0) {
    const returnOrders = orders.filter(
      (o) =>
        (o.returnType && o.returnType !== "NA" && o.returnType !== "") ||
        (o.itemReturnStatus && o.itemReturnStatus.toLowerCase() === "returned") ||
        o.refund < 0
    );
    const saleOrders = orders.filter(
      (o) =>
        (!o.returnType || o.returnType === "NA" || o.returnType === "") &&
        (!o.itemReturnStatus || o.itemReturnStatus.toLowerCase() !== "returned") &&
        o.refund >= 0
    );

    if (summary.saleOrdersCount === 0 && summary.returnsCount === 0) {
      summary.saleOrdersCount = saleOrders.length;
      summary.returnsCount = returnOrders.length;
    }

    // If summary metrics are missing (e.g. CSV upload without Summary tab), compute from orders
    if (summary.netBankSettlement === 0) {
      let sumBank = 0;
      let sumInputGstTcs = 0;
      let sumTds = 0;
      let sumSpf = 0;

      for (const o of orders) {
        sumBank += o.bankSettlementValue || 0;
        sumInputGstTcs += o.inputGstTcsCredits || 0;
        sumTds += o.incomeTaxCredits || 0;
        sumSpf += o.protectionFund || 0;
      }

      summary.netBankSettlement = Number(sumBank.toFixed(2));
      summary.inputGstTcsCredits = Number(sumInputGstTcs.toFixed(2));
      summary.incomeTaxCredits = Number(sumTds.toFixed(2));
      summary.totalRealizableAmount = Number((sumBank + sumInputGstTcs + sumTds).toFixed(2));
      summary.protectionFundClaim = Number(sumSpf.toFixed(2));
      summary.ordersSettlement = Number(sumBank.toFixed(2));
      summary.saleOrdersCount = saleOrders.length;
      summary.returnsCount = returnOrders.length;
    }
  }

  return {
    report: {
      fileName: file.name,
      fileSize: file.size,
      sheetNames,
      parsedAt: new Date().toISOString(),
    },
    summary,
    orders,
    gstDetails,
    ads,
  };
}
