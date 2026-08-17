import { ReportSchema } from "../common/field-definition";
import { PNL_V1_SKU_FIELDS, PNL_V1_ORDERS_FIELDS } from "./versions/pnl.v1";

export const FLIPKART_PNL_SCHEMA_V1: ReportSchema = {
  id: "flipkart-pnl-v1",
  reportType: "profit_loss",
  version: "v1",
  sheets: [
    {
      sheetNamePattern: ["Overall Summary", "OverallSummary", "Summary"],
      displayName: "Overall Summary",
      required: false,
      fields: [],
    },
    {
      sheetNamePattern: ["SKU-level P&L", "SKU Level P&L", "SKU P&L", "SKULevelPnL"],
      displayName: "SKU-level P&L",
      required: false,
      fields: PNL_V1_SKU_FIELDS,
    },
    {
      sheetNamePattern: ["Orders P&L", "Order P&L", "OrdersPnL", "Order Level P&L"],
      displayName: "Orders P&L",
      required: true,
      fields: PNL_V1_ORDERS_FIELDS,
    },
    {
      sheetNamePattern: ["Report Help", "ReportHelp", "Help", "Dictionary"],
      displayName: "Report Help",
      required: false,
      fields: [],
    },
  ],
  fields: [...PNL_V1_SKU_FIELDS, ...PNL_V1_ORDERS_FIELDS],
};
