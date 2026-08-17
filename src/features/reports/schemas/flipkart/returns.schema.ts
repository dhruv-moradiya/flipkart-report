import { ReportSchema } from "../common/field-definition";
import { RETURNS_V1_FIELDS } from "./versions/returns.v1";

export const FLIPKART_RETURNS_SCHEMA_V1: ReportSchema = {
  id: "flipkart-returns-v1",
  reportType: "returns",
  version: "v1",
  sheets: [
    {
      sheetNamePattern: ["Returns", "Sheet1", "Returns Data", "Returns_Data", "Return"],
      displayName: "Returns Data",
      required: true,
      fields: RETURNS_V1_FIELDS,
    },
  ],
  fields: RETURNS_V1_FIELDS,
};
