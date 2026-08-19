import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface MonthlyClearanceSummary {
  totalOrdersCount: number;
  settledOrdersCount: number;
  pendingOrdersCount: number;
  totalNetEarnings: number;
  totalAmountSettled: number;
  totalAmountPending: number;
  overallSettlementRate: number;
}

export interface MonthlyClearanceBreakdown {
  reportingPeriod: string;
  periodLabel: string;
  reportImportId?: string;
  totalOrdersCount: number;
  settledOrdersCount: number;
  pendingOrdersCount: number;
  totalNetEarnings: number;
  totalAmountSettled: number;
  totalAmountPending: number;
  settlementRate: number;
}

export interface OrderClearanceItem {
  orderId: string;
  orderItemId: string;
  orderDate: string | null;
  sku: string;
  productName?: string;
  orderStatus?: string;
  channelOfSale?: string;
  sellingPrice: number;
  netEarnings: number;
  amountSettled: number;
  amountPending: number;
  isSettled: boolean;
  reportingPeriod: string;
  periodLabel: string;
}

export interface SettlementClearanceData {
  summary: MonthlyClearanceSummary;
  monthlyBreakdown: MonthlyClearanceBreakdown[];
  orders: OrderClearanceItem[];
}

export function useSettlementClearance(periodFilter?: string) {
  return useQuery<SettlementClearanceData>({
    queryKey: ["settlement-clearance", periodFilter],
    queryFn: async () => {
      const res = await apiClient.get("/api/analytics/settlements/clearance", {
        params: periodFilter ? { periodFilter } : undefined,
      });
      return res.data.data;
    },
  });
}
