import { ExpenseBreakdown, SkuPnlRecord, OrderPnlRecord } from "../models/pnl.models";

export interface FinancialValidationSummary {
  checkedRecords: number;
  discrepanciesCount: number;
  warnings: string[];
}

/**
 * Calculates sum of individual expense breakdown components
 */
export function sumExpenseBreakdown(expenses: ExpenseBreakdown): number {
  return (
    (expenses.commissionFee || 0) +
    (expenses.collectionFee || 0) +
    (expenses.fixedFee || 0) +
    (expenses.pickAndPackFee || 0) +
    (expenses.forwardShippingFee || 0) +
    (expenses.reverseShippingFee || 0) +
    (expenses.storageFee || 0) +
    (expenses.recallFee || 0) +
    (expenses.productCancellationFee || 0) +
    (expenses.noCostEmiFeeReimbursement || 0) +
    (expenses.installationFee || 0) +
    (expenses.techVisitFee || 0) +
    (expenses.uninstallationPackagingFee || 0) +
    (expenses.customerAddonsRecovery || 0) +
    (expenses.franchiseFee || 0) +
    (expenses.shopsyMarketingFee || 0) +
    (expenses.offerAdjustments || 0) +
    (expenses.gst || 0) +
    (expenses.tcs || 0) +
    (expenses.tds || 0)
  );
}

/**
 * Validates financial consistency for SKU-level P&L records
 */
export function validateSkuFinancials(records: SkuPnlRecord[], tolerance = 1.0): FinancialValidationSummary {
  const warnings: string[] = [];
  let discrepanciesCount = 0;

  records.forEach((rec, idx) => {
    // 1. Validate expenses breakdown vs official totalExpenses
    if (rec.totalExpenses !== 0 && rec.expenses) {
      const breakdownSum = sumExpenseBreakdown(rec.expenses);
      const diff = Math.abs(Math.abs(breakdownSum) - Math.abs(rec.totalExpenses));
      if (diff > tolerance) {
        discrepanciesCount++;
        if (warnings.length < 5) {
          warnings.push(
            `SKU "${rec.sku}": Expense breakdown sum (${breakdownSum}) differs from official Total Expenses (${rec.totalExpenses}) by ₹${diff.toFixed(2)}.`
          );
        }
      }
    }

    // 2. Validate units reconciliation
    const calculatedNet = rec.grossUnits - rec.returnedCancelledUnits;
    if (rec.netUnits !== 0 && Math.abs(calculatedNet - rec.netUnits) > 0) {
      if (warnings.length < 5) {
        warnings.push(
          `SKU "${rec.sku}": Net Units (${rec.netUnits}) differs from Gross (${rec.grossUnits}) - Ret+Canc (${rec.returnedCancelledUnits}).`
        );
      }
    }
  });

  return {
    checkedRecords: records.length,
    discrepanciesCount,
    warnings,
  };
}

/**
 * Validates financial consistency for Orders P&L records
 */
export function validateOrdersFinancials(orders: OrderPnlRecord[], tolerance = 1.0): FinancialValidationSummary {
  const warnings: string[] = [];
  let discrepanciesCount = 0;

  orders.forEach((ord) => {
    if (ord.totalExpenses !== 0 && ord.expenses) {
      const breakdownSum = sumExpenseBreakdown(ord.expenses);
      const diff = Math.abs(Math.abs(breakdownSum) - Math.abs(ord.totalExpenses));
      if (diff > tolerance) {
        discrepanciesCount++;
        if (warnings.length < 5) {
          warnings.push(
            `Order Item "${ord.orderItemId}": Expense breakdown sum (${breakdownSum}) differs from official Total Expenses (${ord.totalExpenses}) by ₹${diff.toFixed(2)}.`
          );
        }
      }
    }
  });

  return {
    checkedRecords: orders.length,
    discrepanciesCount,
    warnings,
  };
}
