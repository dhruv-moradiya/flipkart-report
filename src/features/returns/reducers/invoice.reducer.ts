import { ReturnRecord } from "../types/return.types";
import { InvoiceAnalytics } from "../types/analytics.types";

/**
 * Calculates Invoice & Tax IRN analytics
 *
 * Source Columns: IRN Number, Invoice Number, Invoice Date
 */
export function calculateInvoiceAnalytics(returns: ReturnRecord[]): InvoiceAnalytics {
  let recordsWithInvoice = 0;
  let recordsWithIrn = 0;

  returns.forEach((r) => {
    if (r.invoiceNumber) recordsWithInvoice++;
    if (r.irnNumber) recordsWithIrn++;
  });

  const hasData = recordsWithInvoice > 0 || recordsWithIrn > 0;

  return {
    hasData,
    recordsWithInvoice,
    recordsWithIrn,
  };
}
