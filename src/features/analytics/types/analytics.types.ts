export type TopNCount = 5 | 10 | 15 | 20;

export interface SimpleBarDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
  category?: string;
  rawKey?: string;
  fill?: string;
}

export interface GroupedBarDatum {
  category: string;
  [key: string]: string | number | undefined;
}

export interface TimeSeriesDatum {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
}

export interface PieChartDatum {
  name: string;
  value: number;
  percentage?: number;
  fill?: string;
}

export interface ScatterPointDatum {
  id: string;
  name: string;
  x: number;
  y: number;
  z?: number;
  category?: string;
  sku?: string;
  product?: string;
  formattedX?: string;
  formattedY?: string;
}

export interface OverviewFinancialMetric {
  accountedNetSales: number;
  totalExpenses: number;
  netEarnings: number;
  amountSettled: number;
  amountPending: number;
  grossUnits: number;
  netUnits: number;
  returnedCancelledUnits: number;
  totalOrders: number;
  totalOrderItems: number;
  totalSkus: number;
}
